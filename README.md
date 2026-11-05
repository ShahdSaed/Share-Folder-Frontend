# 📁 Company File Hub — Sotaico Shared Folder

نظام إدارة ومشاركة الملفات والمستندات الداخلي لشركة **Sotaico**، مبني بأحدث إصدارات **Angular (Standalone Architecture)** لتوفير بيئة عمل آمنة، سريعة وسهلة الاستخدام لإدارة الملفات والتحكم بالصلاحيات وتتبع الأنشطة.

---

## 📑 جدول المحتويات / Table of Contents

- [نظرة عامة (Overview)](#-نظرة-عامة-overview)
- [المميزات الرئيسية (Key Features)](#-المميزات-الرئيسية-key-features)
- [التقنيات المستخدمة (Tech Stack)](#-التقنيات-المستخدمة-tech-stack)
- [هيكلية المشروع (Project Architecture)](#-هيكلية-المشروع-project-architecture)
- [متطلبات التشغيل والتثبيت (Getting Started)](#-متطلبات-التشغيل-والتثبيت-getting-started)
- [إعدادات البيئة (Environment Configuration)](#-إعدادات-البيئة-environment-configuration)
- [الأوامر المتاحة (Available Scripts)](#-الأوامر-المتاحة-available-scripts)
- [التكامل مع الـ Backend (API & Security)](#-التكامل-مع-الـ-backend-api--security)
- [دليل المساهمة وسير العمل (Git Workflow)](#-دليل-المساهمة-وسير-العمل-git-workflow)

---

## 🌟 نظرة عامة (Overview)

تم تصميم **Company File Hub** ليكون المنصة المركزية لتبادل المستندات والملفات داخل المؤسسة مع ضمان أعلى معايير الأمان والخصوصية:
- **تحكم صارم في الصلاحيات (RBAC):** فصل كامل بين واجهات وصلاحيات الإدارة (`Admin`) والمستخدمين (`Viewer`).
- **حماية المستندات بكلمات مرور:** إمكانية تعيين كلمة مرور لأي ملف حساس قبل السماح بتحميله أو معاينته.
- **معاينة المستندات داخل المتصفح مباشرة:** دعم فتح ملفات PDF، الصور، ملفات الأكواد والنصوص، بالإضافة إلى استعراض محتويات ملفات الأرشيف المضغوطة (`.zip`).
- **سجل تدقيق شامل (Audit Logs):** رصد وتوثيق كل عملية تحميل، عرض، إضافة، أو حذف تتم على النظام.

---

## 🚀 المميزات الرئيسية (Key Features)

### 1. المصادقة والأمان (Authentication & Security)
- تسجيل دخول آمن باستخدام **JWT Authentication**.
- تجديد الجلسة واستعادتها تلقائياً عند إعادة تحميل الصفحة (`Session Initializer`).
- مسارات محمية باستخدام **Angular Route Guards** (`authGuard`, `adminGuard`, `dashboardGuard`).
- استخدام **HTTP Interceptor** لإرفاق توكن المصادقة تلقائياً ومعالجة أخطاء الصلاحيات (`401 / 403`).

### 2. إدارة الملفات المتقدمة (Admin File Management)
- رفع الملفات مع خيارات تحديد التصنيف، الوسوم (Tags)، وكلمة مرور اختيارية.
- التحكم بحالة الملفات (تفعيل/تعطيل، إتاحة التحميل والمعاينة).
- بحث وتصفية متعددة المستويات حسب القسم، النوع، أو التاريخ.
- إجراءات مجمعة (Bulk Actions) مثل الحذف أو التنزيل الجماعي.

### 3. بوابة الملفات المشتركة (Shared Files Portal)
- واجهة سلسة للموظفين لاستعراض الملفات المصرح لهم بها فقط.
- نافذة مخصصة لإدخال كلمة المرور للملفات المحمية (`FilePasswordModal`).
- تنزيل فوري للملفات المصرح بها.

### 4. مستعرض المستندات المتقدم (Document Viewer)
- معاينة حية داخل المتصفح دون الحاجة لتنزيل الملف مسبقاً.
- دعم مستندات **PDF** وصور عالية الدقة مع أدوات تحكم (Zoom In/Out, Rotate, Reset).
- دعم فك واستعراض محتويات الأرشيف المضغوط **ZIP Archives** في المتصفح باستخدام مكتبة `JSZip`.
- معاينة النصوص والأكواد بترميز منسق وسهل القراءة.

### 5. إدارة المستخدمين (User Management)
- إضافة مستخدمين جدد وتعديل بياناتهم.
- تعيين وتغيير الأدوار (`Admin` / `Viewer`).
- تفعيل أو تعطيل حسابات المستخدمين بضغطة زر.

### 6. سجل الأنشطة والتدقيق (Activity & Audit Logs)
- سجل زمني مفصل لكل إجراء يتم في النظام (من قام بماذا ومتى).
- فلاتر مخصصة حسب التاريخ، نوع الإجراء (Upload, Download, View, Delete)، والمستخدم.
- مؤشرات بصرية لحالة الإجراءات لسهولة المتابعة الرقابية.

### 7. لوحة الإحصائيات (Dashboard)
- إحصائيات سريعة لحجم الملفات، أحدث الإضافات، والعمليات الأكثر نشاطاً.
- وصول سريع لأهم الملفات والمستندات المستخدمة حديثاً.

---

## 🛠 التقنيات المستخدمة (Tech Stack)

| التقنية / المكتبة | الغرض |
| :--- | :--- |
| **Angular 21** | إطار العمل الأساسي مع معمارية Standalone Components |
| **TypeScript 5.9** | لغة البرمجة الأساسية بنظام نمطي صارم (Strict Typing) |
| **RxJS** | إدارة العمليات غير المتزامنة والتدفقات البرمجية (Reactive Streams) |
| **@lucide/angular** | حزمة أيقونات عصرية وخفيفة الوزن لواجهات النظام |
| **JSZip** | قراءة وفحص ملفات الأرشيف المضغوطة (.zip) داخل المتصفح |
| **SCSS / CSS Modern Layouts** | تصميم مخصص واجهات وتجربة مستخدم عصرية ومتجاوبة (Responsive) |
| **Vitest** | بيئة الاختبارات الأحادية فائقة السرعة |

---

## 📂 هيكلية المشروع (Project Architecture)

```
frontend/
├── public/                     # الأصول الثابتة والشعارات (Logos, Favicons)
├── src/
│   ├── app/
│   │   ├── core/               # الخدمات الأساسية والمشتركة لكامل التطبيق
│   │   │   ├── interceptors/   # Auth HTTP Interceptor
│   │   │   ├── mock-data/      # بيانات تجريبية للتطوير المستقل
│   │   │   ├── models/         # واجهات وأنواع البيانات (TypeScript Interfaces)
│   │   │   └── services/       # خدمات الـ API (Auth, Files, Users, Audit, Dashboard)
│   │   ├── features/           # صفحات وميزات النظام
│   │   │   ├── admin/          # صفحات الإدارة (Files, Users, Activity Logs)
│   │   │   ├── auth/           # صفحة تسجيل الدخول (Login)
│   │   │   ├── dashboard/      # لوحة التحكم والإحصائيات
│   │   │   ├── document-viewer/# مستعرض المستندات المتقدم
│   │   │   └── files/          # الملفات المشتركة ونوافذ الحماية
│   │   ├── guards/             # حراس المسارات (Route Guards)
│   │   ├── layouts/            # الهياكل التخطيطية (Main Layout)
│   │   └── shared/             # المكونات والعناصر القابلة لإعادة الاستخدام (Sidebar, Topbar, Icons)
│   ├── environments/           # ملفات إعدادات البيئات (Dev & Prod)
│   ├── styles.scss             # الأنماط والتنسيقات العامة
│   └── main.ts                 # نقطة الانطلاق الرئيسية لتطبيق Angular
├── angular.json                # إعدادات مشروع Angular CLI
├── package.json                # التبعيات وحزم المشروع
└── README.md                   # توثيق المشروع
```

---

## 💻 متطلبات التشغيل والتثبيت (Getting Started)

### المتطلبات الأساسية (Prerequisites)
- تثبيت **Node.js** (الإصدار 20+ أو 22+ الموصى به للاستقرار LTS).
- مدير الحزم **npm** أو **pnpm**.
- بيئة تشغيل الـ Backend الخاصة بالنظام (أو استخدام الـ Mock data المدمجة عند التطوير المستقل).

### خطوات التثبيت والتشغيل

1. **استنساخ المستودع (Clone Repository):**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **تثبيت التبعيات (Install Dependencies):**
   ```bash
   npm install
   ```

3. **تشغيل خادم التطوير (Run Development Server):**
   ```bash
   npm start
   # أو
   ng serve
   ```

4. **فتح التطبيق:**
   توجه في المتصفح إلى: `http://localhost:4200/`

---

## ⚙️ إعدادات البيئة (Environment Configuration)

يمكن ضبط عنوان الـ API الخاص بالخادم في ملفات الإعدادات:
- للتطوير المحلي: `src/environments/environment.development.ts`
- للإنتاج: `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
};
```

---

## 📜 الأوامر المتاحة (Available Scripts)

- `npm start`: تشغيل خادم التطوير المحلي مع خاصية Hot-Reload.
- `npm run build`: تجميع وبناء المشروع للإنتاج وإنتاج ملفات `dist/`.
- `npm run watch`: بناء المشروع في وضع المراقبة (Development Watch mode).
- `npm test`: تشغيل اختبارات الوحدة باستخدام `Vitest`.

---

## 🔒 التكامل مع الـ Backend (API & Security)

يتواصل التطبيق مع خادم الـ API عبر المسارات القياسية التالية:
- `POST /auth/login`: تسجيل الدخول والحصول على رمز JWT.
- `GET /auth/me`: استرجاع بيانات المستخدم الحالي.
- `GET /files`, `POST /files/upload`, `DELETE /files/:id`: إدارة الملفات ورفعها.
- `POST /files/:id/verify-password`: التحقق من كلمة مرور الملف لفك قفله.
- `GET /users`, `POST /users`, `PATCH /users/:id`: إدارة المستخدمين والصلاحيات.
- `GET /audit-logs`: استرجاع سجلات التدقيق والأنشطة.
- `GET /dashboard/stats`: إحصائيات لوحة التحكم.

> **ملاحظة أمان:** يتم تلقائياً تمرير رأس التوثيق `Authorization: Bearer <token>` مع كل استدعاء HTTP عبر `authInterceptor`.

---

## 🌿 سير العمل في Git (Git Workflow)

1. يتم تطوير الميزات على الفروع المخصصة (مثل فرع `shahd`).
2. كتابة رسائل التعديل باتباع مواصفات **Conventional Commits**:
   - `feat(...)`: ميزة جديدة.
   - `refactor(...)`: إعادة تنظيم وتحسين بنية الكود.
   - `chore(...)`: تحديث إعدادات أو حزم.
   - `docs(...)`: توثيق وملفات الشرح.
3. دمج التعديلات في فرع `main` بعد التحقق من نجاح الـ Build والاختبارات.
