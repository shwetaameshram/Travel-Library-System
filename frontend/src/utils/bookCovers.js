export const DEFAULT_BOOK_COVER = '/images/books/default-book.jpg';

export const bookCoverMap = {
  'atomic habits': '/images/books/atomic-habits.jpg',
  '1984': '/images/books/1984.jpg',
  'the psychology of money': '/images/books/psychology-of-money.jpg',
  'psychology of money': '/images/books/psychology-of-money.jpg',
  'ikigai': '/images/books/ikigai.jpg',
  'rich dad poor dad': '/images/books/rich-dad-poor-dad.jpg',
  'automated test express book': '/images/books/express-test-book.jpg',
  'test express book': '/images/books/express-test-book.jpg'
};

export function getBookCover(book) {
  if (!book) return DEFAULT_BOOK_COVER;

  // 1. If backend API returns explicit cover_image path
  if (book.cover_image && typeof book.cover_image === 'string' && book.cover_image.trim() !== '') {
    return book.cover_image;
  }

  // 2. Match by title (case-insensitive)
  const normalizedTitle = (book.title || '').trim().toLowerCase();
  if (bookCoverMap[normalizedTitle]) {
    return bookCoverMap[normalizedTitle];
  }

  // 3. Partial keyword matching
  for (const [key, coverPath] of Object.entries(bookCoverMap)) {
    if (normalizedTitle.includes(key)) {
      return coverPath;
    }
  }

  // 4. Default Fallback
  return DEFAULT_BOOK_COVER;
}
