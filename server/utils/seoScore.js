module.exports.generateSeoScore = function (blog) {
  let score = 0;

  // Title length (best 50–60 chars)
  if (blog.meta_title && blog.meta_title.length <= 60) score += 15;
  else if (blog.meta_title) score += 8; // not perfect but ok

  // Description length (best 140–160 chars)
  if (blog.meta_description && blog.meta_description.length <= 160) score += 15;
  else if (blog.meta_description) score += 8;

  // Keyword presence in content
  if (blog.meta_keywords && blog.meta_keywords.length > 0) {
    const keywords = blog.meta_keywords.join(" ").toLowerCase();
    if (blog.content?.toLowerCase().includes(keywords)) score += 15;
    else score += 8;
  }

  // Image ALT text check
  if (blog.image_alt_text && blog.image_alt_text.length > 3) score += 10;

  // Slug quality (short & readable)
  if (blog.slug && blog.slug.length < 60) score += 10;

  // Tags count
  if (blog.tags && blog.tags.length >= 3) score += 10;

  // Heading structure (H2/H3 usage)
  const h2Count = (blog.content.match(/<h2>/g) || []).length;
  const h3Count = (blog.content.match(/<h3>/g) || []).length;
  if (h2Count + h3Count >= 2) score += 10;

  // Keyword in title
  if (
    blog.meta_keywords &&
    blog.meta_keywords.length &&
    blog.title.toLowerCase().includes(blog.meta_keywords[0].toLowerCase())
  ) {
    score += 15;
  }

  // Normalize score to max 100
  if (score > 100) score = 100;

  return score;
};
