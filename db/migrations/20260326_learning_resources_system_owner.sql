UPDATE app_learning.content_items
SET
    author_user_id = NULL,
    author_name = NULL
WHERE scope = 'aprendizaje'
  AND (author_user_id IS NOT NULL OR author_name IS NOT NULL);
