import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoriesAPI } from '../services/api';
import type { Category } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import RetroButton from '../components/RetroButton';
import RetroInput from '../components/RetroInput';
import RetroTextarea from '../components/RetroTextarea';

const CategoryManagement: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        name_ar: '',
        description: '',
        description_ar: ''
    });
    const [showForm, setShowForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchCategories();
    }, [isAuthenticated, user]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await categoriesAPI.getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await categoriesAPI.updateCategory(editingCategory.id, categoryForm);
                alert(t('cat.updated'));
            } else {
                await categoriesAPI.createCategory(categoryForm);
                alert(t('cat.created'));
            }
            setCategoryForm({ name: '', name_ar: '', description: '', description_ar: '' });
            setEditingCategory(null);
            setShowForm(false);
            fetchCategories();
        } catch (error) {
            alert(t('cat.failedSave'));
        }
    };

    const handleEditCategory = (cat: Category) => {
        setEditingCategory(cat);
        setCategoryForm({
            name: cat.name,
            name_ar: cat.name_ar,
            description: cat.description,
            description_ar: cat.description_ar
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);

    const handleDeleteCategory = async (id: number) => {
        try {
            await categoriesAPI.deleteCategory(id);
            setConfirmingDeleteId(null);
            fetchCategories();
        } catch (error) {
            alert(t('cat.failedDelete'));
        }
    };

    const filteredCategories = categories.filter(cat => {
        const query = searchQuery.toLowerCase();
        return (
            cat.name.toLowerCase().includes(query) ||
            cat.name_ar.toLowerCase().includes(query) ||
            cat.description.toLowerCase().includes(query) ||
            cat.description_ar.toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="font-pixel text-accent-primary-bright animate-pulse">{t('common.loading')}</div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="font-pixel-2xl text-accent-primary-bright crt-glow">
                    {t('nav.categoryManagement').toUpperCase()}
                </h1>
                <RetroButton
                    onClick={() => {
                        if (showForm) {
                            setEditingCategory(null);
                            setCategoryForm({ name: '', name_ar: '', description: '', description_ar: '' });
                        }
                        setShowForm(!showForm);
                    }}
                    variant={showForm ? 'secondary' : 'primary'}
                >
                    {showForm ? t('common.cancel').toUpperCase() : t('cat.new').toUpperCase()}
                </RetroButton>
            </div>

            <div className="mb-6">
                <RetroInput
                    placeholder={t('search.placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                />
            </div>

            <div className="space-y-8">
                {/* Category Form */}
                {showForm && (
                    <div className="bg-bg-secondary pixel-border p-6 max-w-2xl mx-auto">
                        <h2 className="font-pixel-lg text-accent-primary-bright mb-6">
                            {editingCategory ? t('cat.edit').toUpperCase() : t('cat.add').toUpperCase()}
                        </h2>
                        <form onSubmit={handleCategorySubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <RetroInput
                                    label={t('cat.nameEn')}
                                    required
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                />
                                <RetroInput
                                    label={t('cat.nameAr')}
                                    required
                                    dir="rtl"
                                    value={categoryForm.name_ar}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name_ar: e.target.value })}
                                />
                            </div>
                            <RetroTextarea
                                label={t('cat.descEn')}
                                rows={3}
                                value={categoryForm.description}
                                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                            />
                            <RetroTextarea
                                label={t('cat.descAr')}
                                rows={3}
                                dir="rtl"
                                value={categoryForm.description_ar}
                                onChange={(e) => setCategoryForm({ ...categoryForm, description_ar: e.target.value })}
                            />
                            <div className="flex gap-4">
                                <RetroButton type="submit" variant="primary" className="flex-1">
                                    {editingCategory ? t('common.update') : t('common.submit')}
                                </RetroButton>
                            </div>
                        </form>
                    </div>
                )}

                <div className="section-divider"></div>

                {/* Categories List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCategories.map((cat) => {
                        const isConfirming = confirmingDeleteId === cat.id;

                        return (
                            <div key={cat.id} className="bg-bg-secondary pixel-border p-4 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-pixel text-accent-primary-bright">{cat.name}</h3>
                                        <h3 className="font-pixel text-accent-primary-bright" dir="rtl">{cat.name_ar}</h3>
                                    </div>
                                    <p className="text-text-secondary text-xs line-clamp-3 mb-4">{cat.description}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {!isConfirming ? (
                                        <div className="flex gap-2">
                                            <RetroButton
                                                variant="secondary"
                                                className="flex-1 text-[10px]"
                                                onClick={() => handleEditCategory(cat)}
                                            >
                                                {t('common.edit')}
                                            </RetroButton>
                                            <RetroButton
                                                variant="danger"
                                                className="flex-1 text-[10px]"
                                                onClick={() => setConfirmingDeleteId(cat.id)}
                                            >
                                                {t('common.delete')}
                                            </RetroButton>
                                        </div>
                                    ) : (
                                        <div className="bg-bg-tertiary p-2 rounded border border-error/30 animate-pulse">
                                            <p className="font-pixel text-[10px] text-error text-center mb-2">
                                                {t('cat.confirmDelete')}
                                            </p>
                                            <div className="flex gap-2">
                                                <RetroButton
                                                    variant="danger"
                                                    className="flex-1 text-[8px] py-1"
                                                    onClick={() => handleDeleteCategory(cat.id)}
                                                >
                                                    {t('common.confirm')}
                                                </RetroButton>
                                                <RetroButton
                                                    variant="secondary"
                                                    className="flex-1 text-[8px] py-1"
                                                    onClick={() => setConfirmingDeleteId(null)}
                                                >
                                                    {t('common.cancel')}
                                                </RetroButton>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CategoryManagement;
