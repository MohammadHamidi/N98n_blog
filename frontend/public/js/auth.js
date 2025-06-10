// Authentication page logic
class AuthForms {
  constructor() {
    this.init();
  }

  init() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
          const res = await blogAPI.login(email, password);
          if (res.token) {
            ErrorHandler.success('ورود موفقیت‌آمیز');
            window.location.href = 'admin.html';
          } else {
            throw new Error(res.error || 'خطا در ورود');
          }
        } catch (err) {
          ErrorHandler.error(err.message);
        }
      });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        try {
          const res = await blogAPI.register(name, email, password);
          if (res.token) {
            ErrorHandler.success('ثبت نام موفقیت‌آمیز');
            window.location.href = 'admin.html';
          } else {
            throw new Error(res.error || 'خطا در ثبت نام');
          }
        } catch (err) {
          ErrorHandler.error(err.message);
        }
      });
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new AuthForms());
} else {
  new AuthForms();
}
