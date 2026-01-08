const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const BlogCtrl = require("../controllers/blogController");
const { body } = require("express-validator");
const { staffAuth, superAdminOnly, seoOrSuperAdminOnly } = require("../middlewares/staffAuth.middleware");

// =========================
// 📖 Public Routes
// =========================
router.get("/list", BlogCtrl.listBlogs);
router.get("/one/:slugOrId", BlogCtrl.getBlog);
router.post("/preview", BlogCtrl.previewBlog);

// =========================
// ✍️ Protected Routes (Staff Only)
// =========================

// ✅ Create Blog — SEO or Superadmin can create
router.post(
  "/create",
  staffAuth(),
  seoOrSuperAdminOnly,
  upload.fields([
    { name: "featured_image", maxCount: 1 },
    { name: "body_image", maxCount: 3 },
  ]),
  [
    body("author_id").notEmpty(),
    body("title").notEmpty(),
    body("content").notEmpty(),
    body("categories").notEmpty(),
    body("meta_title").notEmpty(),
    body("meta_description").notEmpty(),
    body("blog_url").notEmpty(),
    body("image_alt_text").notEmpty(),
  ],
  BlogCtrl.createBlog
);

// ✅ Update Blog — SEO or Superadmin can edit
router.put(
  "/update/:id",
  staffAuth(),
  seoOrSuperAdminOnly,
  upload.fields([
    { name: "featured_image", maxCount: 1 },
    { name: "body_image", maxCount: 1 },
  ]),
  BlogCtrl.updateBlog
);

// ✅ Delete Blog — only Superadmin
router.delete("/delete/:id", staffAuth(), seoOrSuperAdminOnly, BlogCtrl.deleteBlog);

// ✅ Approve / Publish / Reject Blog — only Superadmin
router.post("/publish/:id", staffAuth(), superAdminOnly, BlogCtrl.setPublishStatus);

router.post(  "/approve-reject/:id", staffAuth(),BlogCtrl.approveOrRejectBlog);

 
  

// ✅ Analytics — only Superadmin
router.get("/analytics/summary", staffAuth(), superAdminOnly, BlogCtrl.analytics);

// =========================
// 💬 Comment System
// =========================
router.post("/:id/comment", BlogCtrl.addComment);
router.get("/:id/comments", staffAuth(), seoOrSuperAdminOnly, BlogCtrl.listComments);
router.post("/:blogId/comments/:commentId/moderate", staffAuth(), seoOrSuperAdminOnly, BlogCtrl.moderateComment);

module.exports = router;
