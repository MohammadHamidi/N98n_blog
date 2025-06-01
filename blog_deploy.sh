#!/bin/bash
# deploy.sh - Production deployment script

set -e

echo "🚀 Starting N8BN Blog deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="n8bn-blog"
BACKUP_DIR="./backups"
LOG_FILE="./deploy.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a $LOG_FILE
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    if [ ! -f ".env" ]; then
        warning ".env file not found, creating from .env.example"
        if [ -f ".env.example" ]; then
            cp .env.example .env
            warning "Please edit .env file with your configuration"
        else
            error ".env.example file not found"
        fi
    fi
    
    success "Prerequisites check passed"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p $BACKUP_DIR
    mkdir -p backend/uploads
    mkdir -p backend/logs
    mkdir -p nginx/logs
    mkdir -p ssl
    
    success "Directories created"
}

# Backup existing data
backup_data() {
    if [ "$1" = "--skip-backup" ]; then
        warning "Skipping backup as requested"
        return
    fi
    
    log "Creating backup..."
    
    BACKUP_NAME="backup-$(date +'%Y%m%d-%H%M%S')"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    mkdir -p $BACKUP_PATH
    
    # Backup MongoDB if running
    if docker ps | grep -q "$PROJECT_NAME-mongo"; then
        log "Backing up MongoDB..."
        docker exec "$PROJECT_NAME-mongo" mongodump --out /tmp/backup
        docker cp "$PROJECT_NAME-mongo:/tmp/backup" "$BACKUP_PATH/mongodb"
        success "MongoDB backup completed"
    fi
    
    # Backup uploads
    if [ -d "backend/uploads" ]; then
        log "Backing up uploads..."
        cp -r backend/uploads "$BACKUP_PATH/"
        success "Uploads backup completed"
    fi
    
    success "Backup completed: $BACKUP_PATH"
}

# Build and deploy
deploy() {
    log "Starting deployment..."
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose down --remove-orphans
    
    # Pull latest images (if using remote images)
    log "Pulling latest images..."
    docker-compose pull --ignore-pull-failures
    
    # Build images
    log "Building images..."
    docker-compose build --no-cache
    
    # Start services
    log "Starting services..."
    if [ "$1" = "--with-nginx" ]; then
        docker-compose --profile nginx up -d
    elif [ "$1" = "--with-admin" ]; then
        docker-compose --profile admin up -d
    elif [ "$1" = "--full" ]; then
        docker-compose --profile nginx --profile admin up -d
    else
        docker-compose up -d
    fi
    
    success "Services started"
}

# Health checks
health_check() {
    log "Performing health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check backend
    log "Checking backend health..."
    if curl -f http://localhost:3000/health &> /dev/null; then
        success "Backend is healthy"
    else
        error "Backend health check failed"
    fi
    
    # Check frontend
    log "Checking frontend health..."
    if curl -f http://localhost:8080/health.html &> /dev/null; then
        success "Frontend is healthy"
    else
        error "Frontend health check failed"
    fi
    
    # Check MongoDB
    log "Checking MongoDB health..."
    if docker exec "$PROJECT_NAME-mongo" mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
        success "MongoDB is healthy"
    else
        error "MongoDB health check failed"
    fi
    
    success "All health checks passed"
}

# Show status
show_status() {
    log "Deployment status:"
    echo ""
    docker-compose ps
    echo ""
    
    echo "📊 Service URLs:"
    echo "🌐 Blog: http://localhost:8080"
    echo "📝 Admin Panel: http://localhost:8080/admin.html"
    echo "🔧 API: http://localhost:3000"
    echo "💾 API Health: http://localhost:3000/health"
    
    if docker ps | grep -q "$PROJECT_NAME-mongo-express"; then
        echo "📊 MongoDB Admin: http://localhost:8081"
    fi
    
    if docker ps | grep -q "$PROJECT_NAME-nginx"; then
        echo "🚀 Nginx Proxy: http://localhost:80"
    fi
    
    echo ""
    echo "📁 Important paths:"
    echo "📂 Uploads: ./backend/uploads"
    echo "📄 Logs: ./backend/logs"
    echo "💾 Backups: ./backups"
    echo ""
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last 10 backups
    if [ -d "$BACKUP_DIR" ]; then
        ls -t $BACKUP_DIR | tail -n +11 | xargs -r -I {} rm -rf "$BACKUP_DIR/{}"
        success "Old backups cleaned up"
    fi
}

# Main deployment function
main() {
    echo "🚀 N8BN Blog Deployment Script"
    echo "=============================="
    
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            create_directories
            backup_data $2
            deploy $2
            health_check
            cleanup_backups
            show_status
            success "Deployment completed successfully!"
            ;;
        "backup")
            backup_data
            ;;
        "restore")
            if [ -z "$2" ]; then
                error "Please specify backup directory: ./deploy.sh restore backup-20231201-120000"
            fi
            restore_backup $2
            ;;
        "status")
            show_status
            ;;
        "logs")
            docker-compose logs -f ${2:-}
            ;;
        "stop")
            docker-compose down
            success "Services stopped"
            ;;
        "restart")
            docker-compose restart ${2:-}
            success "Services restarted"
            ;;
        "update")
            backup_data
            docker-compose pull
            docker-compose up -d
            health_check
            success "Services updated"
            ;;
        *)
            echo "Usage: $0 {deploy|backup|restore|status|logs|stop|restart|update}"
            echo ""
            echo "Commands:"
            echo "  deploy [--with-nginx|--with-admin|--full] [--skip-backup]"
            echo "  backup"
            echo "  restore <backup-directory>"
            echo "  status"
            echo "  logs [service-name]"
            echo "  stop"
            echo "  restart [service-name]"
            echo "  update"
            echo ""
            echo "Examples:"
            echo "  $0 deploy --with-nginx"
            echo "  $0 deploy --full --skip-backup"
            echo "  $0 logs backend"
            echo "  $0 restore backup-20231201-120000"
            ;;
    esac
}

# Make script executable and run
main "$@"

# Additional utility scripts

# scripts/seed-data.sh
#!/bin/bash
# Seed database with sample data

echo "🌱 Seeding database with sample data..."

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
until docker exec n8bn-blog-mongo mongosh --eval "db.adminCommand('ping')" &> /dev/null; do
    sleep 2
done

# Run the seeding script
docker exec n8bn-blog-mongo mongosh n8bn_blog --eval "
// Sample categories
db.categories.insertMany([
  {
    name: 'Unity Development',
    slug: 'unity-development',
    description: 'آموزش‌های مربوط به توسعه بازی با Unity',
    color: '#667eea',
    icon: 'fas fa-gamepad',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'MQ5 Trading',
    slug: 'mq5-trading',
    description: 'برنامه‌نویسی ربات‌های معاملاتی',
    color: '#28a745',
    icon: 'fas fa-chart-line',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Sample tags
db.tags.insertMany([
  { name: 'Unity', slug: 'unity', color: '#667eea', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'C#', slug: 'csharp', color: '#fd7e14', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'MQ5', slug: 'mq5', color: '#28a745', isActive: true, createdAt: new Date(), updatedAt: new Date() }
]);

print('✅ Sample data inserted successfully!');
"

echo "✅ Database seeding completed!"

# scripts/ssl-setup.sh
#!/bin/bash
# SSL certificate setup for production

echo "🔒 Setting up SSL certificates..."

# Create SSL directory
mkdir -p ssl

# Option 1: Self-signed certificate (for development)
if [ "$1" = "--self-signed" ]; then
    echo "Creating self-signed certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/key.pem \
        -out ssl/cert.pem \
        -subj "/C=IR/ST=Tehran/L=Tehran/O=N8BN/OU=Blog/CN=localhost"
    
    echo "✅ Self-signed certificate created"
    echo "⚠️ Remember to add certificate exception in browser"
fi

# Option 2: Let's Encrypt (for production)
if [ "$1" = "--letsencrypt" ]; then
    if [ -z "$2" ]; then
        echo "❌ Please provide domain name: $0 --letsencrypt yourdomain.com"
        exit 1
    fi
    
    DOMAIN=$2
    echo "Setting up Let's Encrypt for $DOMAIN..."
    
    # Install certbot if not available
    if ! command -v certbot &> /dev/null; then
        echo "Installing certbot..."
        apt-get update
        apt-get install -y certbot
    fi
    
    # Get certificate
    certbot certonly --standalone \
        --email admin@$DOMAIN \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN
    
    # Copy certificates
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/cert.pem
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/key.pem
    
    echo "✅ Let's Encrypt certificate setup completed"
    echo "🔄 Don't forget to setup auto-renewal"
fi

echo "SSL setup completed!"

# scripts/monitoring.sh
#!/bin/bash
# Simple monitoring script

echo "📊 N8BN Blog Monitoring"
echo "======================="

# Check container status
echo "📦 Container Status:"
docker-compose ps

echo ""
echo "💾 Memory Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo ""
echo "📊 Database Statistics:"
docker exec n8bn-blog-mongo mongosh n8bn_blog --eval "
print('Posts:', db.posts.countDocuments());
print('Categories:', db.categories.countDocuments());
print('Tags:', db.tags.countDocuments());
print('Total Views:', db.posts.aggregate([{\\$group: {_id: null, total: {\\$sum: '\\$views'}}}]).toArray()[0]?.total || 0);
"

echo ""
echo "📁 Disk Usage:"
echo "Uploads: $(du -sh backend/uploads 2>/dev/null || echo '0B')"
echo "Logs: $(du -sh backend/logs 2>/dev/null || echo '0B')"
echo "Backups: $(du -sh backups 2>/dev/null || echo '0B')"

echo ""
echo "🌐 Service Health:"
curl -s http://localhost:3000/health && echo " ✅ Backend healthy" || echo " ❌ Backend unhealthy"
curl -s http://localhost:8080/health.html >/dev/null && echo "✅ Frontend healthy" || echo "❌ Frontend unhealthy"

# Makefile for easy commands
# Makefile

.PHONY: help install start stop restart logs status backup deploy clean

help: ## Show this help message
	@echo "N8BN Blog - Available Commands:"
	@echo "================================"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install and setup the project
	@echo "🚀 Installing N8BN Blog..."
	@cp .env.example .env || true
	@echo "📝 Please edit .env file with your configuration"
	@echo "✅ Installation completed"

start: ## Start all services
	@echo "🚀 Starting services..."
	@docker-compose up -d
	@echo "✅ Services started"

start-full: ## Start all services including nginx and admin
	@echo "🚀 Starting all services..."
	@docker-compose --profile nginx --profile admin up -d
	@echo "✅ All services started"

stop: ## Stop all services
	@echo "🛑 Stopping services..."
	@docker-compose down
	@echo "✅ Services stopped"

restart: ## Restart all services
	@echo "🔄 Restarting services..."
	@docker-compose restart
	@echo "✅ Services restarted"

logs: ## Show logs for all services
	@docker-compose logs -f

logs-backend: ## Show backend logs
	@docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	@docker-compose logs -f frontend

status: ## Show status of all services
	@echo "📊 Service Status:"
	@docker-compose ps
	@echo ""
	@echo "🌐 Service URLs:"
	@echo "Blog: http://localhost:8080"
	@echo "Admin: http://localhost:8080/admin.html"
	@echo "API: http://localhost:3000"

backup: ## Create backup of data
	@echo "💾 Creating backup..."
	@./deploy.sh backup
	@echo "✅ Backup completed"

deploy: ## Deploy to production
	@echo "🚀 Deploying to production..."
	@./deploy.sh deploy
	@echo "✅ Deployment completed"

seed: ## Seed database with sample data
	@echo "🌱 Seeding database..."
	@./scripts/seed-data.sh
	@echo "✅ Database seeded"

clean: ## Clean up unused Docker resources
	@echo "🧹 Cleaning up..."
	@docker system prune -f
	@docker volume prune -f
	@echo "✅ Cleanup completed"

build: ## Build all images
	@echo "🔨 Building images..."
	@docker-compose build --no-cache
	@echo "✅ Build completed"

dev: ## Start in development mode
	@echo "🛠️ Starting in development mode..."
	@docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "✅ Development environment started"