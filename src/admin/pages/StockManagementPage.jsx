import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Search, Trash2, Edit, Image, ChevronLeft, ChevronRight, X, Filter, Download } from 'lucide-react';

const ProductManagementPage = () => {
  const [products, setProducts] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [activeImageIndexes, setActiveImageIndexes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // State for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  // Change: Store multiple images instead of a single image
  const [productImages, setProductImages] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [imagePreviewIndex, setImagePreviewIndex] = useState(0);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

  // Get unique categories for the filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(product => product.category))];
    return uniqueCategories.sort();
  }, [products]);

  // Load SweetAlert2 dynamically
  useEffect(() => {
    if (typeof window.Swal === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Fetch products from the API
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:4000/api/product/get-all');
      console.log('API Response:', response.data);

      let productData = [];
      if (Array.isArray(response.data)) {
        productData = response.data;
      }
      else if (response.data && Array.isArray(response.data.data)) {
        productData = response.data.data;
      }
      else if (response.data && response.data.products && Array.isArray(response.data.products)) {
        productData = response.data.products;
      }
      else {
        console.error('Unexpected API response format:', response.data);
        setError('Received unexpected data format from server');
        setIsLoading(false);
        return;
      }

      // Process products with proper sizes from API
      const processedProducts = productData.map(product => ({
        ...product,
        images: Array.isArray(product.images) ? product.images : [],
        sizes: Array.isArray(product.sizes) ? product.sizes : []
      }));

      setProducts(processedProducts);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
      setIsLoading(false);
    }
  };

  // Delete product function
  const deleteProduct = async (id) => {
    setIsDeleting(id);
    try {
      let useSweetAlert = typeof window.Swal !== 'undefined';
      let shouldDelete = false;

      if (useSweetAlert) {
        const result = await window.Swal.fire({
          title: 'Are you sure?',
          text: "You won't be able to revert this!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete it!'
        });
        shouldDelete = result.isConfirmed;
      } else {
        shouldDelete = window.confirm("Are you sure you want to delete this product?");
      }

      if (!shouldDelete) {
        setIsDeleting(null);
        return;
      }

      const token = localStorage.getItem("token");
      const response = await axios.delete(`http://localhost:4000/api/product/delete-product/${id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200 || response.status === 204) {
        setProducts(prevProducts => prevProducts.filter(product =>
          (product._id !== id && product.id !== id)
        ));

        if (useSweetAlert) {
          window.Swal.fire('Deleted!', 'Your product has been deleted.', 'success');
        } else {
          alert("Product deleted successfully!");
        }
      } else {
        throw new Error(`Delete failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      let errorMessage = 'Failed to delete product. Please try again.';

      if (error.response) {
        errorMessage = `Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`;
      } else if (error.request) {
        errorMessage = 'Network error: No response received from server';
      } else {
        errorMessage = `Error: ${error.message}`;
      }

      if (typeof window.Swal !== 'undefined') {
        window.Swal.fire('Error!', errorMessage, 'error');
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle image selection for preview - Updated for multiple files
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setProductImages(files);

      // Create preview URLs for all selected files
      const newPreviewUrls = [];

      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviewUrls.push(reader.result);
          if (newPreviewUrls.length === files.length) {
            setImagePreviewUrls(newPreviewUrls);
            setImagePreview(newPreviewUrls[0]); // Set first image as the current preview
            setImagePreviewIndex(0);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Navigation between image previews
  const handlePrevPreviewImage = () => {
    if (imagePreviewUrls.length <= 1) return;
    const newIndex = (imagePreviewIndex - 1 + imagePreviewUrls.length) % imagePreviewUrls.length;
    setImagePreviewIndex(newIndex);
    setImagePreview(imagePreviewUrls[newIndex]);
  };

  const handleNextPreviewImage = () => {
    if (imagePreviewUrls.length <= 1) return;
    const newIndex = (imagePreviewIndex + 1) % imagePreviewUrls.length;
    setImagePreviewIndex(newIndex);
    setImagePreview(imagePreviewUrls[newIndex]);
  };

  // Update product with multiple image uploads
  const updateProduct = async () => {
    setIsUpdating(true);
    setUpdateError(null);

    try {
      const token = localStorage.getItem("token");
      const productId = editingProduct.id || editingProduct._id;

      const formData = new FormData();
      formData.append('title', editingProduct.title);
      formData.append('description', editingProduct.description);
      formData.append('price', parseFloat(editingProduct.price));
      formData.append('category', editingProduct.category);
      formData.append('quantity', parseInt(editingProduct.quantity, 10));
      formData.append('size', editingProduct.size);

      // Add multiple images to formData
      if (productImages.length > 0) {
        // Use a different field name based on your API
        productImages.forEach(image => {
          formData.append('images', image);
        });
      }

      const response = await axios.put(
        `http://localhost:4000/api/product/update-product/${productId}`,
        formData,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.status === 200) {
        setProducts(prevProducts =>
          prevProducts.map(product => {
            if ((product._id === productId) || (product.id === productId)) {
              const updatedProduct = {
                ...product,
                title: editingProduct.title,
                description: editingProduct.description,
                price: parseFloat(editingProduct.price),
                category: editingProduct.category,
                quantity: Number(editingProduct.quantity, 10),
                size: editingProduct.size,
                lastUpdated: new Date()
              };

              // Update images based on API response format
              if (response.data.imageUrls && Array.isArray(response.data.imageUrls)) {
                // If API returns an array of image URLs
                updatedProduct.images = response.data.imageUrls;
              } else if (response.data.imageUrl) {
                // If API returns a single imageUrl string
                updatedProduct.images = [response.data.imageUrl];
              } else if (response.data.images && Array.isArray(response.data.images)) {
                // Another possible API response format
                updatedProduct.images = response.data.images;
              }

              return updatedProduct;
            }
            return product;
          })
        );

        if (typeof window.Swal !== 'undefined') {
          window.Swal.fire('Updated!', 'Your product has been updated.', 'success');
        } else {
          alert("Product updated successfully!");
        }

        setShowEditModal(false);
        setEditingProduct(null);
        setProductImages([]);
        setImagePreview(null);
        setImagePreviewUrls([]);
      } else {
        throw new Error(`Update failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      let errorMessage = 'Failed to update product. Please try again.';

      if (error.response) {
        errorMessage = `Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`;
      } else if (error.request) {
        errorMessage = 'Network error: No response received from server';
      } else {
        errorMessage = `Error: ${error.message}`;
      }

      setUpdateError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Initialize active image indexes
  useEffect(() => {
    const initialIndexes = {};
    products.forEach(product => {
      initialIndexes[product.id || product._id] = 0;
    });
    setActiveImageIndexes(initialIndexes);
  }, [products]);

  // Handle edit modal opening
  const handleEditProduct = (productId) => {
    const product = products.find(p => p.id === productId || p._id === productId);
    if (product) {
      setEditingProduct({ ...product });

      // Initialize preview with existing product images
      if (product.images && product.images.length > 0) {
        setImagePreviewUrls(product.images);
        setImagePreview(product.images[0]);
        setImagePreviewIndex(0);
      } else {
        setImagePreviewUrls([]);
        setImagePreview(null);
      }

      setProductImages([]);
      setShowEditModal(true);
    }
  };

  // Handle input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Sorting and filtering logic
  const sortedAndFilteredProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm) {
      result = result.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory !== 'all') {
      result = result.filter(product => product.category === filterCategory);
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [products, sortConfig, searchTerm, filterCategory]);

  // Image navigation functions
  const handlePrevImage = (productId, e) => {
    if (e) e.preventDefault();
    const product = products.find(p => p.id === productId || p._id === productId);
    if (!product || !Array.isArray(product.images) || product.images.length <= 1) return;

    setActiveImageIndexes(prev => {
      const currentIndex = prev[productId] || 0;
      const imageCount = product.images.length;
      const newIndex = (currentIndex - 1 + imageCount) % imageCount;
      return { ...prev, [productId]: newIndex };
    });
  };

  const handleNextImage = (productId, e) => {
    if (e) e.preventDefault();
    const product = products.find(p => p.id === productId || p._id === productId);
    if (!product || !Array.isArray(product.images) || product.images.length <= 1) return;

    setActiveImageIndexes(prev => {
      const currentIndex = prev[productId] || 0;
      const imageCount = product.images.length;
      const newIndex = (currentIndex + 1) % imageCount;
      return { ...prev, [productId]: newIndex };
    });
  };

  // Export report function
  const exportReport = () => {
    const csv = [
      ['Name', 'Price', 'Category', 'Sizes', 'Quantity', 'Last Updated'],
      ...products.map(product => [
        product.title,
        product.price,
        product.category || '',
        product.size || '',
        product.quantity || '0',
        product.lastUpdated
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-inventory-report.csv';
    a.click();
  };

  return (
    <div id='stock' className="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
      {/* Dashboard Header */}
      <div className="flex flex-col space-y-4 mb-4 sm:mb-6">
        <div className="bg-gradient-to-r from-purple-900 to-indigo-800 rounded-lg shadow-xl p-3 sm:p-6 mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white text-center tracking-wide">
            PRODUCT MANAGEMENT
          </h1>
          <div className="w-16 sm:w-24 h-1 bg-yellow-400 mx-auto mt-2 rounded-full"></div>
        </div>

        {/* Search Controls - Mobile First */}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
          {/* Search Input - Full width on mobile */}
          <div className="relative flex flex-col sm:col-span-2">
            <div className="flex w-full">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 border rounded-l-md w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-300 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition duration-150"
                onClick={() => console.log('Searching for:', searchTerm)}
              >
                Search
              </button>
            </div>
          </div>

          {/* Filter & Export - Stack on mobile, side by side on larger screens */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-2 sm:col-span-1 lg:col-span-2">
            {/* Filter Dropdown - Mobile version with popover */}
            <div className="relative w-full sm:w-auto">
              <button
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition duration-150 flex items-center justify-center w-full sm:w-auto"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <Filter size={16} className="mr-2" />
                <span className="truncate">{filterCategory === 'all' ? 'All Categories' : filterCategory}</span>
              </button>

              {showFilterDropdown && (
                <div className="absolute z-10 mt-1 w-full sm:w-48 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                  <div className="py-1">
                    <button
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterCategory === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                      onClick={() => {
                        setFilterCategory('all');
                        setShowFilterDropdown(false);
                      }}
                    >
                      All Categories
                    </button>
                    {categories.map(category => (
                      <button
                        key={category}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterCategory === category ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                        onClick={() => {
                          setFilterCategory(category);
                          setShowFilterDropdown(false);
                        }}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Export Button */}
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150 flex items-center justify-center w-full sm:w-auto"
              onClick={exportReport}
            >
              <Download size={16} className="mr-2" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-6 rounded-lg text-center">
          <AlertTriangle size={32} className="mx-auto mb-2" />
          <p>{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150"
            onClick={fetchProducts}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {sortedAndFilteredProducts.length > 0 ? sortedAndFilteredProducts.map(product => {
            const productId = product.id || product._id;
            const activeImageIndex = activeImageIndexes[productId] || 0;
            const hasImages = Array.isArray(product.images) && product.images.length > 0;
            const activeImage = hasImages ? product.images[activeImageIndex] : null;

            return (
              <div key={productId} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transform transition-transform duration-200 hover:shadow-xl hover:scale-102">
                {/* Product Image Display */}
                <div className="relative h-48 sm:h-56 md:h-64 bg-gray-100">
                  {activeImage ? (
                    <div className="h-full w-full">
                      <img
                        src={activeImage}
                        alt={`${product.title || 'Product'}`}
                        className="w-full h-full object-cover"
                      />

                      {Array.isArray(product.images) && product.images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => handlePrevImage(productId, e)}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 sm:p-2 hover:bg-gray-100 transition duration-150 shadow-md z-10"
                          >
                            <ChevronLeft size={16} className="sm:hidden" />
                            <ChevronLeft size={20} className="hidden sm:block" />
                          </button>
                          <button
                            onClick={(e) => handleNextImage(productId, e)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 sm:p-2 hover:bg-gray-100 transition duration-150 shadow-md z-10"
                          >
                            <ChevronRight size={16} className="sm:hidden" />
                            <ChevronRight size={20} className="hidden sm:block" />
                          </button>

                          <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1 sm:space-x-2">
                            {product.images.map((_, index) => (
                              <button
                                key={index}
                                className={`h-2 w-2 sm:h-3 sm:w-3 rounded-full transition-colors duration-200 ${index === activeImageIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'}`}
                                onClick={() => setActiveImageIndexes(prev => ({ ...prev, [productId]: index }))}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Image size={32} className="text-gray-400 sm:hidden" />
                      <Image size={48} className="text-gray-400 hidden sm:block" />
                      <p className="text-gray-400 ml-2 text-sm sm:text-base">No images</p>
                    </div>
                  )}

                  <div className="absolute top-2 right-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded-full font-semibold shadow-sm">
                      {product.category || 'Uncategorized'}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h2 className="text-base sm:text-lg font-semibold mb-1 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent line-clamp-1">
                        {product.title}
                      </h2>
                      <div className="text-base sm:text-lg font-bold text-blue-600 ml-2 flex-shrink-0">
                        ₹{product.price?.toFixed(2) || '0.00'}
                      </div>
                    </div>

                    <div className="mb-2 sm:mb-3">
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                        {product.description || 'No description available'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2 text-xs sm:text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Size:</span>
                        <p className="font-semibold">{product.size || "none"}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Qty:</span>
                        <p className="font-semibold">{product.quantity || 0}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Category</span>
                        <p>{product.category || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Last Updated</span>
                        <p className="truncate">{new Date(product.lastUpdated || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-3 sm:mt-4">
                    <button
                      className="flex items-center justify-center px-2 sm:px-3 py-1.5 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 text-xs sm:text-sm w-1/2 mr-2 transition duration-150"
                      onClick={() => handleEditProduct(productId)}
                      disabled={isDeleting === productId}
                    >
                      <Edit size={14} className="mr-1" />
                      Edit
                    </button>
                    <button
                      className="flex items-center justify-center px-2 sm:px-3 py-1.5 border border-red-600 text-red-600 rounded hover:bg-red-50 text-xs sm:text-sm w-1/2 transition duration-150"
                      onClick={() => deleteProduct(productId)}
                      disabled={isDeleting === productId}
                    >
                      {isDeleting === productId ? (
                        <span className="flex items-center">
                          <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-red-600 border-t-transparent rounded-full mr-1 sm:mr-2"></div>
                          <span className="truncate">Deleting...</span>
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Trash2 size={14} className="mr-1" />
                          Delete
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full text-center py-8 sm:py-16 bg-white rounded-lg shadow">
              <Image size={32} className="mx-auto text-gray-400 mb-3 sm:mb-4 sm:hidden" />
              <Image size={48} className="mx-auto text-gray-400 mb-4 hidden sm:block" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Product Modal - Made responsive */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden my-2 sm:my-0">
            <div className="flex justify-between items-center p-3 sm:p-4 border-b">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Edit Product</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            {updateError && (
              <div className="px-3 sm:px-4 py-2 bg-red-50 border-l-4 border-red-500 text-red-700 mb-3 sm:mb-4 text-sm">
                <p>{updateError}</p>
              </div>
            )}

            <div className="p-3 sm:p-4 overflow-y-auto max-h-[60vh] sm:max-h-[calc(100vh-200px)]">
              <div className="space-y-3 sm:space-y-4">
                {/* Image Upload */}
                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                  <div className="border-2 border-dashed border-gray-300 p-3 sm:p-4 rounded-lg text-center relative">
                    {imagePreview && (
                      <div className="mb-3 sm:mb-4 relative">
                        <img src={imagePreview} alt="Preview" className="mx-auto max-h-40 sm:max-h-48" />

                        {imagePreviewUrls.length > 1 && (
                          <>
                            <button
                              onClick={handlePrevPreviewImage}
                              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md"
                            >
                              <ChevronLeft size={20} />
                            </button>
                            <button
                              onClick={handleNextPreviewImage}
                              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md"
                            >
                              <ChevronRight size={20} />
                            </button>

                            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                              {imagePreviewUrls.map((_, index) => (
                                <button
                                  key={index}
                                  className={`h-2 w-2 mx-1 rounded-full ${index === imagePreviewIndex ? 'bg-blue-600' : 'bg-gray-300'}`}
                                  onClick={() => {
                                    setImagePreviewIndex(index);
                                    setImagePreview(imagePreviewUrls[index]);
                                  }}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      id="product-images"
                      onChange={handleImageChange}
                    />
                    <label
                      htmlFor="product-images"
                      className="cursor-pointer inline-flex items-center px-3 sm:px-4 py-2 border border-blue-700 rounded-md shadow-sm text-xs sm:text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
                    >
                      <Image className="mr-1 sm:mr-2 h-4 w-4" />
                      Choose Images
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB. Multiple images allowed.
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={editingProduct.title || ''}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      id="description"
                      rows="3"
                      value={editingProduct.description || ''}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    ></textarea>
                  </div>

                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        name="price"
                        id="price"
                        value={editingProduct.price || 0}
                        onChange={handleEditInputChange}
                        className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                    <input
                      type="text"
                      name="category"
                      id="category"
                      value={editingProduct.category || ''}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      name="quantity"
                      id="quantity"
                      value={editingProduct.quantity || 0}
                      onChange={handleEditInputChange}
                      min="0"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="size" className="block text-sm font-medium text-gray-700">Size</label>
                    <input
                      type="text"
                      name="size"
                      id="size"
                      value={editingProduct.size || ''}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-3 sm:px-4 py-3 bg-gray-50 text-right sm:flex sm:justify-end border-t">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex justify-center items-center mb-2 sm:mb-0 sm:mr-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                onClick={updateProduct}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Updating...
                  </>
                ) : (
                  'Update Product'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagementPage;