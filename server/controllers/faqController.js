const FAQ = require('../models/faq.model');
const mongoose = require('mongoose');

/** Helper to parse pageSlugs input (string or array or comma-separated) */
function parsePageSlugs(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(s => String(s).trim()).filter(Boolean);
  return String(input)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

/* CREATE FAQ document (for one or many page slugs) */
async function createFAQ(req, res) {
  try {
    const { pageSlugs: rawPageSlugs, pageSlug, faqs, createdBy, status } = req.body;

    const pageSlugs = parsePageSlugs(rawPageSlugs || pageSlug);
    if (!createdBy || !mongoose.Types.ObjectId.isValid(createdBy)) {
      return res.status(400).json({ success: false, message: 'createdBy (valid user id) is required' });
    }

    if (!Array.isArray(faqs) || faqs.length === 0) {
      return res.status(400).json({ success: false, message: 'faqs array required (at least one Q/A)' });
    }

    const doc = new FAQ({
      pageSlugs: pageSlugs.length ? pageSlugs : ['*'], // default to global if nothing provided
      faqs,
      createdBy,
      status: status || 'draft'
    });

    const saved = await doc.save();
    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('Create FAQ Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create FAQ', error: err.message });
  }
}

/* UPDATE whole FAQ document (replace pageSlugs / faqs / status etc.) */
async function updateFAQ(req, res) {
  try {
    const faqId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(faqId)) return res.status(400).json({ success: false, message: 'Invalid FAQ id' });

    const doc = await FAQ.findById(faqId);
    if (!doc || doc.is_deleted) return res.status(404).json({ success: false, message: 'FAQ not found' });

    const { pageSlugs: rawPageSlugs, pageSlug, faqs, status } = req.body;

    if (typeof status !== 'undefined') {
      if (!['draft', 'published'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
      doc.status = status;
    }

    if (typeof rawPageSlugs !== 'undefined' || typeof pageSlug !== 'undefined') {
      const parsed = parsePageSlugs(rawPageSlugs || pageSlug);
      doc.pageSlugs = parsed.length ? parsed : ['*'];
    }

    if (typeof faqs !== 'undefined') {
      if (!Array.isArray(faqs)) return res.status(400).json({ success: false, message: 'faqs must be an array' });
      doc.faqs = faqs;
    }

    doc.updatedAt = new Date();
    const saved = await doc.save();
    return res.status(200).json({ success: true, data: saved });
  } catch (err) {
    console.error('Update FAQ Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update FAQ', error: err.message });
  }
}

/* LIST FAQ documents — optionally filter by pageSlug and/or status */
async function listFAQs(req, res) {
  try {
    const { pageSlug, status } = req.query;
    const filters = { is_deleted: false };
    if (status) filters.status = status;

    if (pageSlug) {
      // match docs where pageSlugs contains the requested slug OR '*' (global)
      filters.pageSlugs = { $in: [pageSlug, '*'] };
    }

    const docs = await FAQ.find(filters).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: docs });
  } catch (err) {
    console.error('List FAQs Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to list FAQs', error: err.message });
  }
}

/* GET single FAQ doc by id */
async function getFAQ(req, res) {
  try {
    const faqId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(faqId)) return res.status(400).json({ success: false, message: 'Invalid FAQ id' });

    const doc = await FAQ.findById(faqId).lean();
    if (!doc || doc.is_deleted) return res.status(404).json({ success: false, message: 'FAQ not found' });

    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    console.error('Get FAQ Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch FAQ', error: err.message });
  }
}

/* GET best FAQ doc for a page slug (frontend-friendly): page match -> fallback to '*' */
async function getByPageSlug(req, res) {
  try {
    const slug = req.params.slug;
    if (!slug) return res.status(400).json({ success: false, message: 'page slug required' });

    // Prefer a published page-specific document
    let doc = await FAQ.findOne({ is_deleted: false, status: 'published', pageSlugs: slug }).lean();
    if (!doc) {
      // fallback to a published global document (pageSlugs contains '*')
      doc = await FAQ.findOne({ is_deleted: false, status: 'published', pageSlugs: '*' }).lean();
    }

    if (!doc) return res.status(404).json({ success: false, message: 'No FAQs found for this page' });
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    console.error('GetByPageSlug Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch FAQs', error: err.message });
  }
}


/* Hide/show a specific FAQ item (soft hide) */
async function setFaqItemVisibility(req, res) {
  try {
    const { id: faqId, itemId } = req.params;
    const { is_hidden } = req.body;

    if (!mongoose.Types.ObjectId.isValid(faqId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid id(s)' });
    }

    if (typeof is_hidden !== 'boolean') {
      return res.status(400).json({ success: false, message: 'is_hidden must be boolean' });
    }

    const doc = await FAQ.findById(faqId);
    if (!doc || doc.is_deleted) return res.status(404).json({ success: false, message: 'FAQ not found' });

    const item = doc.faqs.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'FAQ item not found' });

    item.is_hidden = is_hidden;
    await doc.save();

    return res.status(200).json({ success: true, data: item });
  } catch (err) {
    console.error('Set FAQ Item Visibility Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update FAQ item visibility', error: err.message });
  }
}




/* SOFT DELETE a FAQ document */
async function deleteFAQ(req, res) {
  try {
    const faqId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(faqId)) return res.status(400).json({ success: false, message: 'Invalid FAQ id' });

    const doc = await FAQ.findById(faqId);
    if (!doc) return res.status(404).json({ success: false, message: 'FAQ not found' });

    doc.is_deleted = true;
    await doc.save();
    return res.status(200).json({ success: true, message: 'FAQ deleted' });
  } catch (err) {
    console.error('Delete FAQ Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete FAQ', error: err.message });
  }
}

/* SET STATUS publish/draft */
async function setFAQStatus(req, res) {
  try {
    const faqId = req.params.id;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(faqId)) return res.status(400).json({ success: false, message: 'Invalid FAQ id' });
    if (!['draft', 'published'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const doc = await FAQ.findById(faqId);
    if (!doc) return res.status(404).json({ success: false, message: 'FAQ not found' });

    doc.status = status;
    await doc.save();
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    console.error('Set FAQ Status Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update status', error: err.message });
  }
}

/* ----- Per-item (subdocument) operations ----- */

/* Add a single FAQ item to a document */
async function addFaqItem(req, res) {
  try {
    const faqId = req.params.id;
    const { question, answer, order } = req.body;
    if (!question || !answer) return res.status(400).json({ success: false, message: 'question and answer required' });
    if (!mongoose.Types.ObjectId.isValid(faqId)) return res.status(400).json({ success: false, message: 'Invalid FAQ id' });

    const doc = await FAQ.findById(faqId);
    if (!doc || doc.is_deleted) return res.status(404).json({ success: false, message: 'FAQ not found' });

    doc.faqs.push({ question, answer, order: order || 0 });
    await doc.save();

    const added = doc.faqs[doc.faqs.length - 1];
    return res.status(201).json({ success: true, data: added });
  } catch (err) {
    console.error('Add FAQ Item Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add FAQ item', error: err.message });
  }
}

/* Update a single FAQ item */
async function updateFaqItem(req, res) {
  try {
    const { id: faqId, itemId } = req.params;
    const { question, answer, order, is_hidden } = req.body;

    if (!mongoose.Types.ObjectId.isValid(faqId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid id(s)' });
    }

    const doc = await FAQ.findById(faqId);
    if (!doc || doc.is_deleted) return res.status(404).json({ success: false, message: 'FAQ not found' });

    const item = doc.faqs.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'FAQ item not found' });

    if (typeof question !== 'undefined') item.question = question;
    if (typeof answer !== 'undefined') item.answer = answer;
    if (typeof order !== 'undefined') item.order = order;
    if (typeof is_hidden !== 'undefined') item.is_hidden = is_hidden;
    await doc.save();
    return res.status(200).json({ success: true, data: item });
  } catch (err) {
    console.error('Update FAQ Item Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update FAQ item', error: err.message });
  }
}

/* Delete a single FAQ item (remove from array) */
async function deleteFaqItem(req, res) {
  try {
    const { id: faqId, itemId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(faqId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid id(s)' });
    }
    

    const doc = await FAQ.findById(faqId);
    if (!doc || doc.is_deleted) return res.status(404).json({ success: false, message: 'FAQ not found' });

    const item = doc.faqs.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'FAQ item not found' });

    item.remove();
    await doc.save();
    return res.status(200).json({ success: true, message: 'FAQ item removed' });
  } catch (err) {
    console.error('Delete FAQ Item Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete FAQ item', error: err.message });
  }

}

module.exports = {
  createFAQ,
  updateFAQ,
  listFAQs,
  getFAQ,
  getByPageSlug,
  deleteFAQ,
  setFAQStatus,
  addFaqItem,
  updateFaqItem,
  deleteFaqItem,
  setFaqItemVisibility
};
