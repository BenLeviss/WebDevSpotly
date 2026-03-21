import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postsApi } from '../../api/posts';
import { getErrorMessage } from '../../utils/errorUtils';
import '../addPlace/AddPlacePage.css';   // reuse form styles
import './EditPlacePage.css';

// Same list as AddPlacePage
const CATEGORIES = [
    'Café',
    'Restaurant',
    'Park',
    'Viewpoint',
    'Beach',
    'Museum',
    'Bar',
    'Hidden Gem',
    'Other',
];

export default function EditPlacePage() {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();

    // Page-level state
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');

    // Form state
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch the post on mount
    useEffect(() => {
        if (!postId) return;
        setLoading(true);
        postsApi.getPostById(postId)
            .then(({ data }) => {
                setName(data.title);
                setCategory(data.category ?? '');
                setDescription(data.content ?? '');
                setExistingImageUrl(data.imageUrl ?? null);
            })
            .catch(() => setFetchError('Could not load post.'))
            .finally(() => setLoading(false));
    }, [postId]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!postId || !name.trim()) return;

        setError('');
        setSaving(true);
        try {
            await postsApi.updatePost(postId, name.trim(), description.trim(), category, photo);
            navigate('/places');
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to update place.'));
            setSaving(false);
        }
    };

    // The image to show — new photo preview takes priority, then existing
    const displayImage = photoPreview ?? existingImageUrl;

    // ── Loading state ──
    if (loading) {
        return (
            <div className="edit-place-page">
                <div className="edit-place-loading">
                    <div className="edit-place-spinner" />
                </div>
            </div>
        );
    }

    // ── Fetch error state ──
    if (fetchError) {
        return (
            <div className="edit-place-page">
                <header className="edit-place-header">
                    <button className="edit-back-btn" onClick={() => navigate('/places')}>←</button>
                    <h1 className="edit-place-title">Edit Place</h1>
                </header>
                <div className="edit-place-error">{fetchError}</div>
            </div>
        );
    }

    return (
        <div className="edit-place-page">
            {/* Header */}
            <header className="edit-place-header">
                <button className="edit-back-btn" onClick={() => navigate('/places')}>←</button>
                <h1 className="edit-place-title">Edit Place</h1>
            </header>

            <form className="add-place-form" onSubmit={handleSubmit}>

                {/* ── Photo ── */}
                <section className="form-section">
                    <label className="field-label">Photo</label>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        style={{ display: 'none' }}
                        onChange={handlePhotoChange}
                    />

                    {displayImage ? (
                        <div
                            className="current-image-wrap"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <img src={displayImage} alt="Place" />
                            <div className="image-change-overlay">
                                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                                <span>Change Photo</span>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="photo-upload-area"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="upload-icon">↑</div>
                            <p className="upload-text">Tap to upload a photo</p>
                            <p className="upload-hint">JPG or PNG, max 10MB</p>
                        </div>
                    )}
                </section>

                {/* ── Place Name ── */}
                <section className="form-section">
                    <label className="field-label" htmlFor="edit-place-name">Place Name</label>
                    <input
                        id="edit-place-name"
                        className="field-input"
                        type="text"
                        placeholder="e.g. The Hidden Cup"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </section>

                {/* ── Category ── */}
                <section className="form-section">
                    <label className="field-label" htmlFor="edit-place-category">Category</label>
                    <select
                        id="edit-place-category"
                        className="field-input field-select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="">Select a category</option>
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </section>

                {/* ── Description ── */}
                <section className="form-section">
                    <label className="field-label" htmlFor="edit-place-description">Description</label>
                    <textarea
                        id="edit-place-description"
                        className="field-input field-textarea"
                        placeholder="Share what makes this place special..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                        rows={5}
                    />
                    <span className="char-count">{description.length} / 500</span>
                </section>

                {/* ── Error ── */}
                {error && <div className="add-place-error">{error}</div>}

                {/* ── Save button ── */}
                <button
                    id="save-place-btn"
                    className="save-btn"
                    type="submit"
                    disabled={saving || !name.trim()}
                >
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>

            </form>
        </div>
    );
}
