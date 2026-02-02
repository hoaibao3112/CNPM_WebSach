import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authorService from '../../services/authorService';
import productService from '../../services/productService';
import { toast } from 'react-toastify';
import Loading from '../../components/Common/Loading';
import './AuthorPage.css';

const AuthorPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [authors, setAuthors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedAuthor, setSelectedAuthor] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [authorBooks, setAuthorBooks] = useState([]);
    const itemsPerPage = 12;

    useEffect(() => {
        fetchAuthors();
    }, [currentPage, searchTerm]);

    useEffect(() => {
        // If URL has an author ID, open that author's modal
        if (id) {
            handleAuthorClick({ MaTG: id });
        }
    }, [id]);

    const fetchAuthors = async () => {
        try {
            setLoading(true);
            const data = await authorService.getAuthors({
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm
            });

            const authorsArray = data.data || data;
            setAuthors(Array.isArray(authorsArray) ? authorsArray : []);

            if (data.pagination) {
                setTotalPages(data.pagination.totalPages || 1);
            }
        } catch (error) {
            console.error('Error fetching authors:', error);
            toast.error('Không thể tải danh sách tác giả');
            setAuthors([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAuthorClick = async (author) => {
        try {
            setLoading(true);
            const detail = await authorService.getAuthorById(author.MaTG);
            setSelectedAuthor(detail);

            // Fetch books by this author
            const books = detail.books || [];
            setAuthorBooks(books);

            setShowModal(true);
        } catch (error) {
            toast.error('Không thể tải thông tin tác giả');
        } finally {
            setLoading(false);
        }
    };

    const handleBookClick = (bookId) => {
        navigate(`/product/${bookId}`);
        setShowModal(false);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    if (loading && authors.length === 0) return <Loading />;

    return (
        <div className="author-page">
            <div className="container">
                {/* Header */}
                <header className="page-head">
                    <div className="page-icon">
                        <img src="/img/author/icon.jpg" alt="Danh sách tác giả" />
                    </div>
                    <div className="page-title">
                        <h1>Danh Sách Tác Giả</h1>
                        <p className="subtitle">Khám phá tác giả yêu thích của bạn</p>
                    </div>
                    <div className="controls">
                        <input
                            type="text"
                            placeholder="Tìm kiếm tác giả..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                        <div className="pagination">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                ‹
                            </button>
                            <span>Trang {currentPage} / {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                            >
                                ›
                            </button>
                        </div>
                    </div>
                </header>

                {/* Author Grid */}
                <main className="author-grid">
                    {loading ? (
                        <div className="loading">Đang tải...</div>
                    ) : authors.length === 0 ? (
                        <div className="no-results">Không tìm thấy tác giả nào</div>
                    ) : (
                        authors.map(author => (
                            <div
                                key={author.MaTG}
                                className="author-card"
                                onClick={() => handleAuthorClick(author)}
                            >
                                <img
                                    src={author.AnhTG ? `/img/author/${author.AnhTG}` : '/img/author/icon.jpg'}
                                    alt={author.TenTG}
                                    onError={(e) => e.target.src = '/img/author/icon.jpg'}
                                />
                                <div className="author-info">
                                    <h3>{author.TenTG}</h3>
                                    <p>Quốc tịch: {author.QuocTich || 'Không rõ'}</p>
                                </div>
                            </div>
                        ))
                    )}
                </main>
            </div>

            {/* Author Detail Modal */}
            {showModal && selectedAuthor && (
                <div className="modal" onClick={() => setShowModal(false)}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()}>
                        <button className="close" onClick={() => setShowModal(false)}>×</button>

                        <div className="modal-top">
                            <div className="avatar-wrap">
                                <img
                                    src={selectedAuthor.AnhTG ? `/img/author/${selectedAuthor.AnhTG}` : '/img/author/icon.jpg'}
                                    alt={selectedAuthor.TenTG}
                                    onError={(e) => e.target.src = '/img/author/icon.jpg'}
                                />
                            </div>
                            <div className="modal-heading">
                                <h2>{selectedAuthor.TenTG}</h2>
                                <div className="meta">
                                    <div>
                                        <strong>Ngày sinh:</strong>{' '}
                                        {selectedAuthor.NgaySinh
                                            ? new Date(selectedAuthor.NgaySinh).toLocaleDateString('vi-VN')
                                            : 'Không rõ'}
                                    </div>
                                    <div>
                                        <strong>Quốc tịch:</strong> {selectedAuthor.QuocTich || 'Không rõ'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-bio">
                            <h3>Tiểu sử</h3>
                            <p>{selectedAuthor.TieuSu || 'Không có tiểu sử'}</p>
                        </div>

                        <div className="book-section">
                            <h3 className="section-title">Tác phẩm của tác giả</h3>
                            <div className="books-wrapper">
                                <div className="books">
                                    {authorBooks.length === 0 ? (
                                        <div className="no-books">Không có tác phẩm nào</div>
                                    ) : (
                                        authorBooks.slice(0, 5).map(book => (
                                            <div
                                                key={book.MaSP}
                                                className="book"
                                                onClick={() => handleBookClick(book.MaSP)}
                                            >
                                                <div className="book-image">
                                                    <img
                                                        src={`/img/product/${book.HinhAnh}`}
                                                        alt={book.TenSP}
                                                        onError={(e) => e.target.src = '/img/default-book.jpg'}
                                                    />
                                                </div>
                                                <div className="book-name">{book.TenSP}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthorPage;
