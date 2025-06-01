
//# backend/scripts/init-mongo.js (MongoDB initialization script)
//##MongoDB initialization script
db = db.getSiblingDB('n8bn_blog');

//#Create collections
db.createCollection('posts');
db.createCollection('categories');
db.createCollection('tags');

//#Create indexes for better performance
db.posts.createIndex({ "slug": 1 }, { unique: true });
db.posts.createIndex({ "status": 1, "publishedAt": -1 });
db.posts.createIndex({ "categories": 1 });
db.posts.createIndex({ "tags": 1 });
db.posts.createIndex({ "title": "text", "content": "text", "excerpt": "text" });

db.categories.createIndex({ "slug": 1 }, { unique: true });
db.categories.createIndex({ "name": 1 }, { unique: true });

db.tags.createIndex({ "slug": 1 }, { unique: true });
db.tags.createIndex({ "name": 1 }, { unique: true });

//#Insert initial categories
db.categories.insertMany([
  {
    name: "Unity Development",
    slug: "unity-development",
    description: "آموزش‌های مربوط به توسعه بازی با Unity",
    color: "#667eea",
    icon: "fas fa-gamepad",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "MQ5 & Trading",
    slug: "mq5-trading",
    description: "برنامه‌نویسی ربات‌های معاملاتی با MQ5",
    color: "#28a745",
    icon: "fas fa-chart-line",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "C# Programming",
    slug: "csharp-programming",
    description: "آموزش برنامه‌نویسی C#",
    color: "#fd7e14",
    icon: "fas fa-code",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Performance Optimization",
    slug: "performance-optimization",
    description: "بهینه‌سازی عملکرد نرم‌افزارها",
    color: "#dc3545",
    icon: "fas fa-tachometer-alt",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "AI & Machine Learning",
    slug: "ai-machine-learning",
    description: "هوش مصنوعی و یادگیری ماشین",
    color: "#6f42c1",
    icon: "fas fa-brain",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

//#Insert initial tags
db.tags.insertMany([
  { name: "Unity", slug: "unity", color: "#667eea", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { name: "C#", slug: "csharp", color: "#fd7e14", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { name: "MQ5", slug: "mq5", color: "#28a745", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { name: "Trading", slug: "trading", color: "#17a2b8", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { name: "Performance", slug: "performance", color: "#dc3545", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { name: "Mobile", slug: "mobile", color: "#6c757d", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { name: "AI", slug: "ai", color: "#6f42c1", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { name: "Networking", slug: "networking", color: "#20c997", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { name: "Optimization", slug: "optimization", color: "#ffc107", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { name: "Tutorial", slug: "tutorial", color: "#e83e8c", isActive: true, createdAt: new Date(), updatedAt: new Date() }
]);

//#Get category and tag IDs for sample posts
const unityCategory = db.categories.findOne({ slug: "unity-development" });
const tradingCategory = db.categories.findOne({ slug: "mq5-trading" });
const csharpCategory = db.categories.findOne({ slug: "csharp-programming" });
const aiCategory = db.categories.findOne({ slug: "ai-machine-learning" });
const performanceCategory = db.categories.findOne({ slug: "performance-optimization" });

const unityTag = db.tags.findOne({ slug: "unity" });
const csharpTag = db.tags.findOne({ slug: "csharp" });
const mq5Tag = db.tags.findOne({ slug: "mq5" });
const aiTag = db.tags.findOne({ slug: "ai" });
const performanceTag = db.tags.findOne({ slug: "performance" });
const mobileTag = db.tags.findOne({ slug: "mobile" });
const networkingTag = db.tags.findOne({ slug: "networking" });

//#Insert sample posts
const publishedDate = new Date();
publishedDate.setDate(publishedDate.getDate() - 1);

db.posts.insertMany([
  {
    title: "راهنمای کامل Unity برای توسعه بازی‌های موبایل",
    slug: "unity-mobile-game-development-guide",
    excerpt: "در این مقاله جامع، تمامی مفاهیم پایه Unity را از صفر تا صد یاد خواهید گرفت. از ایجاد اولین پروژه تا پیاده‌سازی سیستم‌های پیچیده بازی و بهینه‌سازی عملکرد برای پلتفرم‌های مختلف موبایل.",
    content: `
    <h2>مقدمه</h2>
    <p>Unity یکی از قدرتمندترین موتورهای بازی‌سازی است که امکان توسعه بازی‌های چندپلتفرمه را فراهم می‌کند.</p>
    
    <h2>شروع کار با Unity</h2>
    <p>برای شروع کار با Unity، ابتدا باید نرم‌افزار را از سایت رسمی دانلود کنید.</p>
    
    <h3>نصب و راه‌اندازی</h3>
    <ol>
      <li>دانلود Unity Hub</li>
      <li>نصب ورژن مناسب Unity</li>
      <li>ایجاد پروژه جدید</li>
    </ol>
    
    <h2>مفاهیم پایه</h2>
    <p>در این بخش با مفاهیم کلیدی Unity آشنا می‌شوید:</p>
    <ul>
      <li>GameObject ها</li>
      <li>Component ها</li>
      <li>Scene Management</li>
      <li>Prefab ها</li>
    </ul>
    
    <h2>بهینه‌سازی برای موبایل</h2>
    <p>توسعه بازی برای پلتفرم‌های موبایل نیازمند تکنیک‌های خاصی است:</p>
    
    <h3>مدیریت حافظه</h3>
    <pre><code>
    #نمونه کد برای Object Pooling
    public class ObjectPool : MonoBehaviour
    {
        public GameObject prefab;
        private Queue&lt;GameObject&gt; pool = new Queue&lt;GameObject&gt;();
        
        public GameObject Get()
        {
            if (pool.Count > 0)
                return pool.Dequeue();
            
            return Instantiate(prefab);
        }
        
        public void Return(GameObject obj)
        {
            obj.SetActive(false);
            pool.Enqueue(obj);
        }
    }
    </code></pre>
    
    <h2>نتیجه‌گیری</h2>
    <p>با رعایت این نکات می‌توانید بازی‌های بهینه و حرفه‌ای برای پلتفرم‌های موبایل تولید کنید.</p>
    `,
    author: { name: "محمد احمدی", email: "mohammad@example.com" },
    categories: [unityCategory._id, csharpCategory._id],
    tags: [unityTag._id, csharpTag._id, mobileTag._id],
    status: "published",
    views: 1234,
    likes: 45,
    publishedAt: publishedDate,
    readingTime: 8,
    seo: {
      metaTitle: "آموزش Unity برای توسعه بازی موبایل - راهنمای کامل",
      metaDescription: "راهنمای جامع آموزش Unity برای توسعه بازی‌های موبایل از صفر تا صد",
      keywords: ["Unity", "بازی‌سازی", "موبایل", "C#", "توسعه بازی"]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "توسعه Expert Advisor پیشرفته در MetaTrader 5",
    slug: "advanced-expert-advisor-metatrader5",
    excerpt: "یادگیری نحوه ایجاد ربات‌های معاملاتی قدرتمند با استفاده از زبان MQ5. تکنیک‌های بهینه‌سازی، مدیریت ریسک در معاملات خودکار و پیاده‌سازی استراتژی‌های پیچیده معاملاتی.",
    content: `
    <h2>مقدمه‌ای بر Expert Advisor</h2>
    <p>Expert Advisor یا EA یک برنامه خودکار است که در پلتفرم MetaTrader 5 اجرا می‌شود.</p>
    
    <h2>ساختار پایه یک EA</h2>
    <pre><code>
    //+------------------------------------------------------------------+
    //| Expert advisor start function                                    |
    //+------------------------------------------------------------------+
    void OnTick()
    {
        #منطق معاملاتی اصلی
        if(IsNewBar())
        {
            CheckForSignals();
        }
    }
    
    //+------------------------------------------------------------------+
    //| Check for new bar                                               |
    //+------------------------------------------------------------------+
    bool IsNewBar()
    {
        static datetime last_time = 0;
        datetime current_time = iTime(_Symbol, PERIOD_CURRENT, 0);
        
        if(current_time != last_time)
        {
            last_time = current_time;
            return true;
        }
        return false;
    }
    </code></pre>
    
    <h2>مدیریت ریسک</h2>
    <p>یکی از مهم‌ترین جنبه‌های معاملات خودکار، مدیریت صحیح ریسک است:</p>
    
    <h3>محاسبه اندازه موقعیت</h3>
    <pre><code>
    double CalculateLotSize(double riskPercent, double stopLoss)
    {
        double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
        double riskAmount = accountBalance * riskPercent / 100;
        double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
        double stopLossPoints = stopLoss * _Point;
        
        double lotSize = riskAmount / (stopLossPoints * tickValue);
        return NormalizeDouble(lotSize, 2);
    }
    </code></pre>
    
    <h2>بهینه‌سازی عملکرد</h2>
    <p>برای بهبود عملکرد EA، تکنیک‌های زیر را به کار گیرید:</p>
    <ul>
      <li>استفاده از Static Variables</li>
      <li>کاهش فراخوانی توابع پرهزینه</li>
      <li>بهینه‌سازی الگوریتم‌های تحلیل تکنیکال</li>
    </ul>
    `,
    author: { name: "علی رضایی", email: "ali@example.com" },
    categories: [tradingCategory._id],
    tags: [mq5Tag._id, csharpTag._id],
    status: "published",
    views: 987,
    likes: 32,
    publishedAt: new Date(publishedDate.getTime() - 5 * 24 * 60 * 60 * 1000),
    readingTime: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "پیاده‌سازی هوش مصنوعی در توسعه بازی با C#",
    slug: "ai-implementation-game-development-csharp",
    excerpt: "کاربرد الگوریتم‌های هوش مصنوعی در ایجاد NPC های هوشمند و سیستم‌های تطبیقی در بازی‌ها. از مفاهیم پایه یادگیری ماشین تا پیاده‌سازی عملی در محیط Unity.",
    content: `
    <h2>هوش مصنوعی در بازی‌ها</h2>
    <p>هوش مصنوعی نقش کلیدی در ایجاد تجربه‌های جذاب و چالش‌برانگیز در بازی‌ها دارد.</p>
    
    <h2>الگوریتم‌های پایه AI</h2>
    <h3>State Machine</h3>
    <pre><code>
    public enum EnemyState
    {
        Idle,
        Patrol,
        Chase,
        Attack,
        Dead
    }
    
    public class EnemyAI : MonoBehaviour
    {
        public EnemyState currentState = EnemyState.Idle;
        
        void Update()
        {
            switch(currentState)
            {
                case EnemyState.Idle:
                    IdleBehavior();
                    break;
                case EnemyState.Patrol:
                    PatrolBehavior();
                    break;
                case EnemyState.Chase:
                    ChaseBehavior();
                    break;
            }
        }
    }
    </code></pre>
    
    <h2>Pathfinding با A*</h2>
    <p>الگوریتم A* یکی از محبوب‌ترین روش‌های مسیریابی در بازی‌ها است.</p>
    
    <h2>یادگیری ماشین در بازی</h2>
    <p>استفاده از ML-Agents Unity برای آموزش NPC های هوشمند:</p>
    
    <pre><code>
    public class AgentController : Agent
    {
        public override void OnEpisodeBegin()
        {
            #تنظیمات اولیه هر اپیزود
        }
        
        public override void CollectObservations(VectorSensor sensor)
        {
            #جمع‌آوری داده‌های محیط
            sensor.AddObservation(transform.position);
            sensor.AddObservation(target.position);
        }
        
        public override void OnActionReceived(ActionBuffers actions)
        {
            #اجرای اکشن‌ها
            float moveX = actions.ContinuousActions[0];
            float moveZ = actions.ContinuousActions[1];
            
            Vector3 movement = new Vector3(moveX, 0, moveZ);
            transform.position += movement * Time.deltaTime * speed;
        }
    }
    </code></pre>
    `,
    author: { name: "سارا محمدی", email: "sara@example.com" },
    categories: [unityCategory._id, aiCategory._id],
    tags: [aiTag._id, unityTag._id, csharpTag._id],
    status: "published",
    views: 1567,
    likes: 78,
    publishedAt: new Date(publishedDate.getTime() - 10 * 24 * 60 * 60 * 1000),
    readingTime: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print("✅ Database initialized successfully with sample data!");
print("📊 Created categories:", db.categories.countDocuments());
print("🏷️ Created tags:", db.tags.countDocuments());  
print("📝 Created posts:", db.posts.countDocuments());