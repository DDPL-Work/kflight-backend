const express = require('express');
const router = express.Router();
const faqCtrl = require('../controllers/faqController');

// Document-level
router.post('/', faqCtrl.createFAQ);                 
router.put('/:id', faqCtrl.updateFAQ);               
router.get('/', faqCtrl.listFAQs);                   
router.get('/:id', faqCtrl.getFAQ);                  
router.delete('/:id', faqCtrl.deleteFAQ);           
router.patch('/:id/status', faqCtrl.setFAQStatus);  // change status

// Frontend-friendly: get best FAQ for a page slug (prefers page-specific then global)
router.get('/page/:slug', faqCtrl.getByPageSlug);

// Per-item (subdocument) operations
router.post('/:id/items', faqCtrl.addFaqItem);                // add single Q/A
router.put('/:id/items/:itemId', faqCtrl.updateFaqItem);      // update single Q/A
router.delete('/:id/items/:itemId', faqCtrl.deleteFaqItem);   // delete single Q/A
router.patch('/:id/items/:itemId/visibility', faqCtrl.setFaqItemVisibility); 

module.exports = router;
