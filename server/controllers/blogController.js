const Blog = require('../models/blog.model');
const Staff = require('../models/staff.model');
const mongoose = require('mongoose');
const slugify = require('slugify');
const cloudinary = require('../config/cloudinary');
const { validationResult } = require('express-validator');
const { notifyUser } = require("../utils/notify");
const { generateSeoScore } = require("../utils/seoScore");


function parseArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  // Try JSON
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {}

  // Fallback comma separated
  return String(value)
    .split(',')
    .map(v => v.trim().replace(/^\[|\]$|"/g, ''))
    .filter(Boolean);
}

// Helper: slug generator
function makeSlug(input = '') {
  const base = slugify(input || Date.now().toString(), { lower: true, strict: true });
  return base;
}

// Helper: upload buffer to cloudinary (image)
async function uploadImageToCloudinary(buffer, folder = 'blogs') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });    

}

// Validate express-validator errors
function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  return null;
}

// CREATE
async function createBlog(req, res) {
  try {
    // check for express-validator errors (if used in route)
    const v = handleValidation(req, res);
    if (v) return v;

    const {
      author_id, title, summary = '', sub_title = '', content,
      blog_url, slug, categories,
      meta_title, meta_description, meta_keywords,
      image_alt_text, tags, status
    } = req.body;

    // Mandatory checks (extra precaution)
    if (!author_id || !title || !content || !categories || !meta_title || !meta_description || !blog_url || !image_alt_text) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!mongoose.Types.ObjectId.isValid(author_id)) {
      return res.status(400).json({ success: false, message: 'Invalid author_id' });
    }

    // author existence & role check
    const authorDoc = await Staff.findById(author_id);
    if (!authorDoc) return res.status(404).json({ success: false, message: 'Author not found' });
    if (!['admin','seo','editor'].includes(authorDoc.role)) {
      return res.status(403).json({ success: false, message: 'Author not authorized' });
    }

    // SEO char limits
    if (meta_title.length > 60) return res.status(400).json({ success: false, message: 'Meta title exceeds 60 chars' });
    if (meta_description.length > 160) return res.status(400).json({ success: false, message: 'Meta description exceeds 160 chars' });

    // Slug uniqueness
    let finalSlug = (slug || makeSlug(title)).toLowerCase();
    let suffix = 0;
    while (await Blog.findOne({ slug: finalSlug })) {
      suffix++;
      finalSlug = `${makeSlug(title)}-${suffix}`;
    }


    

    // Parse arrays
    const parsedTags = tags ? (Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()).filter(Boolean)) : [];
    const parsedCategories = Array.isArray(categories) ? categories : String(categories).split(',').map(c => c.trim()).filter(Boolean);
    const parsedKeywords = meta_keywords ? (Array.isArray(meta_keywords) ? meta_keywords : String(meta_keywords).split(',').map(k => k.trim()).filter(Boolean)) : [];

    // Images upload
    let featured_image = null;
    if (req.files?.featured_image?.[0]?.buffer) {
      const uploaded = await uploadImageToCloudinary(req.files.featured_image[0].buffer, 'blogs/featured');
      featured_image = { url: uploaded.secure_url, alt: image_alt_text, public_id: uploaded.public_id };
    }

    let body_image = null;
    if (req.files?.body_image?.[0]?.buffer) {
      const uploaded = await uploadImageToCloudinary(req.files.body_image[0].buffer, 'blogs/body');
      body_image = { url: uploaded.secure_url, alt: image_alt_text, public_id: uploaded.public_id };
    }

    // Sections parsing & uploading (optional)
    let sections = [];
    if (req.body.sections) {
      try {
        const parsedSections = JSON.parse(req.body.sections);
        sections = await Promise.all(parsedSections.map(async (sec, idx) => {
          let secImg = null;
          if (req.files?.[`section_image_${idx}`]?.[0]?.buffer) {
            const uploaded = await uploadImageToCloudinary(req.files[`section_image_${idx}`][0].buffer, 'blogs/sections');
            secImg = { url: uploaded.secure_url, alt: sec.alt || '', public_id: uploaded.public_id };
          }
          return { sub_title: sec.sub_title, body: sec.body, image: secImg };
        }));
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid sections format' });
      }
    }

   // ✅ Determine blog status based on author role
let finalStatus = 'draft';
if (authorDoc.role === 'seo') finalStatus = 'pending_approval';
else if (['superadmin', 'admin'].includes(authorDoc.role)) {
  finalStatus = status || 'draft';
}

// ✅ Create blog document
const blog = new Blog({
  author: `${authorDoc.first_name || ''} ${authorDoc.last_name || ''}`.trim(),
  author_id,
  title,
  summary,
  sub_title,
  content,
  slug: finalSlug,
  blog_url,
  featured_image,
  body_image,
  sections,
  categories: parsedCategories,
  tags: parsedTags,
  meta_title,
  meta_description,
  meta_keywords: parsedKeywords,
  image_alt_text,

  // ✅ Use finalStatus instead of direct status
  status: finalStatus,
  published_at: finalStatus === 'published' ? new Date() : null
});
    blog.seo_score = generateSeoScore(blog);


    const saved = await blog.save();
    await notifyUser({
      staffId: authorDoc._id,
      title: "Blog Created",
      message: `Your blog "${title}" is created and saved.`,
      type: "BLOG",
      meta: { blogId: saved._id }
    });
    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('Create Blog Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create blog', error: err.message });
  }
}

// UPDATE
async function updateBlog(req, res) {

  try {
    const blogId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(blogId)) return res.status(400).json({ success: false, message: 'Invalid blog id' });

    const blog = await Blog.findById(blogId);
    if (!blog || blog.is_deleted) return res.status(404).json({ success: false, message: 'Blog not found' });

    const body = req.body;
    // Update scalar fields
    blog.title = body.title || blog.title;
    blog.summary = body.summary || blog.summary;
    blog.sub_title = body.sub_title || blog.sub_title;
    blog.content = body.content || blog.content;
    blog.blog_url = body.blog_url || blog.blog_url;
    blog.slug = body.slug ? String(body.slug).toLowerCase() : blog.slug;
    blog.meta_title = body.meta_title || blog.meta_title;
    blog.meta_description = body.meta_description || blog.meta_description;
    blog.image_alt_text = body.image_alt_text || blog.image_alt_text;

    if (body.meta_keywords) blog.meta_keywords = Array.isArray(body.meta_keywords) ? body.meta_keywords : String(body.meta_keywords).split(',').map(k => k.trim());
    if (body.tags) blog.tags = Array.isArray(body.tags) ? body.tags : String(body.tags).split(',').map(t => t.trim());
    if (body.categories) blog.categories = Array.isArray(body.categories) ? body.categories : String(body.categories).split(',').map(c => c.trim());

    if (typeof body.status !== 'undefined') {
      blog.status = body.status;
      if (body.status === 'published' && !blog.published_at) blog.published_at = new Date();
    }

    // Featured image update
    if (req.files?.featured_image?.[0]?.buffer) {
      if (blog.featured_image?.public_id) await cloudinary.uploader.destroy(blog.featured_image.public_id).catch(()=>{});
      const uploaded = await uploadImageToCloudinary(req.files.featured_image[0].buffer, 'blogs/featured');
      blog.featured_image = { url: uploaded.secure_url, alt: body.image_alt_text || '', public_id: uploaded.public_id };
    }

    // Body image
    if (req.files?.body_image?.[0]?.buffer) {
      if (blog.body_image?.public_id) await cloudinary.uploader.destroy(blog.body_image.public_id).catch(()=>{});
      const uploaded = await uploadImageToCloudinary(req.files.body_image[0].buffer, 'blogs/body');
      blog.body_image = { url: uploaded.secure_url, alt: body.image_alt_text || '', public_id: uploaded.public_id };
    }

    // Sections update (replace)
    if (body.sections) {
      try {
        blog.sections = JSON.parse(body.sections);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid sections format' });
      }
    }

    blog.updated_at = Date.now();
        blog.seo_score = generateSeoScore(blog);

    const saved = await blog.save();
    return res.status(200).json({ success: true, data: saved });
  } catch (err) {
    console.error('Update Blog Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update blog', error: err.message });
  }
}

// PREVIEW
async function previewBlog(req, res) {
  try {
    // simply return the body as preview (frontend will render)
    return res.status(200).json({ success: true, preview: req.body });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to preview', error: err.message });
  }
}

// ADD COMMENT (public)
async function addComment(req, res) {
  try {
    const blogId = req.params.id;
    const { authorName, authorEmail, text, sectionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(blogId)) return res.status(400).json({ success: false, message: 'Invalid blog id' });
    if (!authorName || !text) return res.status(400).json({ success: false, message: 'authorName and text are required' });

    const blog = await Blog.findById(blogId);
    if (!blog || blog.is_deleted) return res.status(404).json({ success: false, message: 'Blog not found' });

    const comment = {
      authorName,
      authorEmail,
      text,
      status: 'pending',
      meta: { ip: req.ip, userAgent: req.get('User-Agent') || null, sectionId: sectionId || null }
    };

    blog.comments.push(comment);
    await blog.save();
    // return created comment (it will have an _id after save)
    const added = blog.comments[blog.comments.length - 1];
    return res.status(201).json({ success: true, message: 'Comment submitted and pending moderation', data: added });
  } catch (err) {
    console.error('Add Comment Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add comment', error: err.message });
  }
}

// LIST COMMENTS (admin)
async function listComments(req, res) {
  try {
    const blogId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(blogId)) return res.status(400).json({ success: false, message: 'Invalid blog id' });

    const blog = await Blog.findById(blogId).select('comments');
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    return res.status(200).json({ success: true, data: blog.comments });
  } catch (err) {
    console.error('List Comments Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to list comments', error: err.message });
  }
}

// MODERATE COMMENT (approve/reject) (admin)....................
async function moderateComment(req, res) {
  try {
    const { blogId, commentId } = req.params;
    const { action, moderator_id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(blogId) || !mongoose.Types.ObjectId.isValid(commentId)) 
      return res.status(400).json({ success: false, message: 'Invalid id(s)' });

    if (!['approve','reject'].includes(action)) 
      return res.status(400).json({ success: false, message: 'Invalid action' });

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    const comment = blog.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    comment.status = action === 'approve' ? 'approved' : 'rejected';
    comment.moderatedBy = moderator_id && mongoose.Types.ObjectId.isValid(moderator_id) ? moderator_id : null;
    comment.moderatedAt = new Date();

    await blog.save();
    return res.status(200).json({ success: true, message: 'Comment moderated', data: comment });
  } catch (err) {
    console.error('Moderate Comment Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to moderate comment', error: err.message });
  }
}


// GET BLOG (by slug or id) - increments view_count for published posts....................
async function getBlog(req, res) {
  try {
    const { slugOrId } = req.params;
    const query = { is_deleted: false };
    if (mongoose.Types.ObjectId.isValid(slugOrId)) query._id = slugOrId;
    else query.slug = slugOrId.toLowerCase();

    const blog = await Blog.findOne(query).lean();
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    if (blog.status === 'published') {
      Blog.findByIdAndUpdate(blog._id, { $inc: { view_count: 1 } }).catch(()=>{});
      blog.view_count = (blog.view_count || 0) + 1;
    }

    return res.status(200).json({ success: true, data: blog });
  } catch (err) {
    console.error('Get Blog Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch blog', error: err.message });
  }
}

// LIST BLOGS with filters, pagination, search....................
async function listBlogs(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page || 1), 1);
const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const skip = (page - 1) * limit;

    const filters = { is_deleted: false };
    if (req.query.status) filters.status = req.query.status;
    if (req.query.tag) filters.tags = req.query.tag;
    if (req.query.category) filters.categories = req.query.category;
    if (req.query.author_id && mongoose.Types.ObjectId.isValid(req.query.author_id)) filters.author_id = req.query.author_id;

    let findQuery;
    if (req.query.search) {
      findQuery = Blog.find({ $text: { $search: req.query.search }, ...filters }, { score: { $meta: 'textScore' } })
                      .sort({ score: { $meta: 'textScore' }, published_at: -1 });
    } else {
      findQuery = Blog.find(filters).sort({ published_at: -1, created_at: -1 });
    }

    const total = await Blog.countDocuments(filters);
    const data = await findQuery.skip(skip).limit(limit).lean();

    return res.status(200).json({
      success: true,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
      data
    });
  } catch (err) {
    console.error('List Blogs Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to list blogs', error: err.message });
  }
}

// DELETE (soft-delete)
async function deleteBlog(req, res) {
  try {
    const blogId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(blogId)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    blog.is_deleted = true;
    await blog.save();
    return res.status(200).json({ success: true, message: 'Blog deleted' });
  } catch (err) {
    console.error('Delete Blog Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete blog', error: err.message });
  }
}

// SET PUBLISH STATUS
async function setPublishStatus(req, res) {
  try {
    const blogId = req.params.id;
    const { action } = req.body; // changed from status → action

    if (!mongoose.Types.ObjectId.isValid(blogId))
      return res.status(400).json({ success: false, message: 'Invalid id' });

    // map action → status
    const validActions = {
      publish: 'published',
      unpublish: 'draft',
      archive: 'archived'
    };

    const newStatus = validActions[action?.toLowerCase()];
    if (!newStatus)
      return res.status(400).json({ success: false, message: 'Invalid action' });

    const blog = await Blog.findById(blogId);
    if (!blog)
      return res.status(404).json({ success: false, message: 'Blog not found' });

    blog.status = newStatus;
    if (newStatus === 'published') blog.published_at = new Date();
    await blog.save();

    return res.status(200).json({ success: true, message: `Blog ${newStatus}`, data: blog });
  } catch (err) {
    console.error('Set Publish Status Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update status', error: err.message });
  }
}


// ANALYTICS
async function analytics(req, res) {
  try {
    const totalBlogs = await Blog.countDocuments({ is_deleted: false });
    const published = await Blog.countDocuments({ status: 'published', is_deleted: false });
    const totalViewsAgg = await Blog.aggregate([
      { $match: { is_deleted: false } },
      { $group: { _id: null, views: { $sum: '$view_count' }, comments: { $sum: { $size: '$comments' } } } }
    ]);
    const totals = totalViewsAgg[0] || { views: 0, comments: 0 };

    return res.status(200).json({ success: true, data: { totalBlogs, published, totalViews: totals.views, totalComments: totals.comments } });
  } catch (err) {
    console.error('Analytics Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics', error: err.message });
  }
}

// controllers/blogController.js
// controllers/blogController.js
async function approveOrRejectBlog(req, res) {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action = 'approve' | 'reject'
    const approver = req.staff; // from staffAuth middleware

    if (!['approve', 'reject'].includes(action))
      return res.status(400).json({ success: false, message: 'Invalid action' });

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    if (blog.status === 'published')
      return res.status(400).json({ success: false, message: 'Already published' });

    // ✅ Require reason if rejecting
    if (action === 'reject' && !reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required when rejecting a blog'
      });
    }

    if (action === 'approve') {
      blog.status = 'published';
      blog.approved_by = approver._id;
      blog.approved_at = new Date();
      blog.rejection_reason = '';
      blog.published_at = new Date();
    } else {
      blog.status = 'rejected';
      blog.rejection_reason = reason; // ✅ reason must be provided now
      blog.approved_by = approver._id;
      blog.approved_at = new Date();
    }

    await blog.save();
     await notifyUser({
      staffId: blog.author_id,
      title: action === "approve" ? "Blog Approved" : "Blog Rejected",
      message:
        action === "approve"
          ? `Your blog "${blog.title}" has been approved.`
          : `Your blog "${blog.title}" was rejected. Reason: ${reason}`,
      type: "BLOG",
      meta: { blogId: blog._id, action }
    });
    return res.status(200).json({ success: true, data: blog });
  } catch (err) {
    console.error('Approve/Reject Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process approval', error: err.message });
  }
}



module.exports = {
  createBlog,
  updateBlog,
  previewBlog,
  deleteBlog,
  getBlog,
  listBlogs,
  setPublishStatus,
  addComment,
  moderateComment,
  listComments,
  analytics,
  approveOrRejectBlog,
};
