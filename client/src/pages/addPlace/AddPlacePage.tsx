import './AddPlacePage.css';
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsApi } from '../../api/posts';
import { getErrorMessage } from '../../utils/errorUtils';

// The list of categories the user can pick from
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

export default function AddPlacePage() {
    const navigate = useNavigate();

    // --- Form state ---
    // Each piece of data the user fills in is stored in its own state variable.
    // useState(initialValue) returns [currentValue, setterFunction].
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // useRef gives us a direct reference to the hidden <input type="file">.
    // We use it to trigger the file picker dialog when the user clicks the photo area.
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Called when the user picks a file
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create a temporary URL so we can preview the image in the browser
        setPhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // stops the page from reloading (default form behaviour)
        if (!name.trim()) return;
        if (!photo) {
            setError('Please upload a photo.');
            return;
        }
        if (!category) {
            setError('Please select a category.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            // Send to the server — title, description as content, category, and the photo file
            await postsApi.createPost(name.trim(), description.trim(), category, photo);
            navigate('/', { state: { refresh: Date.now() } });
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to share place.'));
            setLoading(false);
        }
    };

    return (
        <div className="add-place-page">

            <form className="add-place-form" onSubmit={handleSubmit}>

                {/* ── Photo Upload ── */}
                <section className="form-section">
                    <label className="field-label">Photo <span className="required-star">*</span></label>

                    {/* Hidden real file input — we trigger it from the styled area below */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        style={{ display: 'none' }}
                        onChange={handlePhotoChange}
                    />

                    {/* Clickable upload area */}
                    <div
                        className="photo-upload-area"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {photoPreview ? (
                            // If a photo was chosen, show the preview
                            <img src={photoPreview} alt="Preview" className="photo-preview" />
                        ) : (
                            // Otherwise show the upload prompt
                            <>
                                <div className="upload-icon">↑</div>
                                <p className="upload-text">Tap to upload a photo</p>
                                <p className="upload-hint">JPG or PNG, max 10MB</p>
                            </>
                        )}
                    </div>
                </section>

                {/* ── Place Name ── */}
                <section className="form-section">
                    <label className="field-label" htmlFor="place-name">Place Name</label>
                    <input
                        id="place-name"
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
                    <label className="field-label" htmlFor="place-category">Category <span className="required-star">*</span></label>
                    <select
                        id="place-category"
                        className="field-input field-select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="">Select a category</option>
                        {CATEGORIES.map((cat) => (
                            // Each option needs a unique `key` — React uses this internally
                            // to track list items efficiently.
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </section>

                {/* ── Description ── */}
                <section className="form-section">
                    <label className="field-label" htmlFor="place-description">Description</label>
                    <textarea
                        id="place-description"
                        className="field-input field-textarea"
                        placeholder="Share what makes this place special..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                        rows={5}
                    />
                    {/* Live character counter */}
                    <span className="char-count">{description.length} / 500</span>
                </section>

                {/* ── Error message ── */}
                {error && <div className="add-place-error">{error}</div>}

                {/* ── Submit button ── */}
                <button
                    id="share-place-btn"
                    className="share-btn"
                    type="submit"
                    disabled={loading || !name.trim() || !photo || !category}
                >
                    {loading ? 'Sharing…' : 'Share This Place'}
                </button>

            </form>
        </div>
    );
}
