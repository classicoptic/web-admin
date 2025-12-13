import React, { useState } from 'react';
import { Image as ImageIcon, X, Upload } from 'lucide-react';
import Swal from 'sweetalert2';
import { Circles } from 'react-loader-spinner';
import axios from 'axios';
import "../pages/page.css"
const AddItemsPage = () => {
  const categories = [
    'Helmets', 'Gloves', 'Jackets', 'Pants', 'Boots',
    'Protection', 'Accessories', 'Parts', 'Tools'
  ];

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    size: '',
    price: '',
    quantity: '',
    description: '',
  });

  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Product name is required';
    if (!formData.category) newErrors.category = 'Please select a category';
    if (!formData.size.trim()) newErrors.size = 'Size details are required';
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) newErrors.price = 'Price must be greater than 0';
    if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0) newErrors.quantity = 'Quantity cannot be negative';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (images.length === 0) newErrors.images = 'At least one image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const validImages = files.filter(file => {
      const isValidType = ['image/png', 'image/jpeg'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    const newImages = validImages.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random()
    }));

    setImages(prev => [...prev, ...newImages].slice(0, 5)); // Limit to 5 images
    if (errors.images) setErrors(prev => ({ ...prev, images: '' }));
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Check for token
      const token = localStorage.getItem("token");
      if (!token) {
        Swal.fire({
          title: 'Error!',
          text: "Only admin can add product",
          icon: 'error',
          confirmButtonColor: '#d33',
        });
        setIsSubmitting(false);
        return;
      }

      // Basic token validation check
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.warn('Token does not appear to be in valid JWT format');
        }
      } catch (e) {
        console.error('Error parsing token:', e);
      }

      // Create a new FormData instance
      const formDataForSubmit = new FormData();

      // Append all text fields
      formDataForSubmit.append('title', formData.title.trim());
      formDataForSubmit.append('category', formData.category);
      formDataForSubmit.append('size', formData.size.trim());
      formDataForSubmit.append('description', formData.description.trim());

      // Convert numeric values to strings explicitly
      formDataForSubmit.append('price', formData.price.toString());
      formDataForSubmit.append('quantity', formData.quantity.toString());

      // Append creation timestamp
      formDataForSubmit.append('createdAt', new Date().toISOString());

      // Log form data being submitted for debugging
      console.log('Form data being submitted:', {
        title: formData.title,
        category: formData.category,
        size: formData.size,
        price: formData.price,
        quantity: formData.quantity,
        description: formData.description,
        imageCount: images.length
      });
      console.log('Token exists:', Boolean(token));

      // Append images with correct field name
      images.forEach((img, index) => {
        formDataForSubmit.append('images', img.file);
        // Log each file to check for issues
        console.log(`Appending image ${index}:`, img.file.name, img.file.type, img.file.size);
      });

      // Submit the form data

      const response = await axios.post('https://web-backend-eta.vercel.app/api/product/add', formDataForSubmit, {

        headers: {
          'Authorization': `Bearer ${token}`,
        },
        timeout: 30000
      });

      console.log('Server response:', response.data);

      // Success notification
      Swal.fire({
        title: 'Success!',
        text: 'Product added successfully!',
        icon: 'success',
        confirmButtonColor: '#3085d6',
      });

      // Reset form
      setFormData({
        title: '',
        category: '',
        size: '',
        price: '',
        quantity: '',
        description: ''
      });
      setImages([]);
      setErrors({});

    } catch (error) {
      console.error('Error adding product:', error);

      // Detailed error logging
      if (error.response) {
        console.log('Error data:', error.response.data);
        console.log('Error status:', error.response.status);
        console.log('Error headers:', error.response.headers);
      } else if (error.request) {
        console.log('No response received:', error.request);
      } else {
        console.log('Error message:', error.message);
      }

      // Error notification
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to add product. Product already exists.',
        icon: 'error',
        confirmButtonColor: '#d33',
      });

      setErrors(prev => ({
        ...prev,
        submit: 'Failed to add product. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id='additem' className="flex justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-4xl px-4 py-8 mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Add New Product</h1>
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter product name"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category.toLowerCase()}>{category}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Size Details</label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter size details (e.g., XL, US 10, One Size)"
                />
                {errors.size && <p className="text-red-500 text-xs mt-1">{errors.size}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price ₹</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter price"
                  min="0.01"
                  step="0.01"
                />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter stock quantity"
                  min="0"
                  step="1"
                />
                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter product description"
              ></textarea>
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                  {images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img src={img.preview} alt="Preview" className="h-24 w-full object-cover rounded-md" />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:bg-gray-50">
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={images.length >= 5}
                />
                <ImageIcon className="h-10 w-10 text-gray-400" />
                <span className="mt-2 text-sm text-gray-600">
                  {images.length >= 5 ? 'Maximum of 5 images reached' : 'Click to upload (max 5 images)'}
                </span>
                {images.length < 5 && (
                  <p className="mt-1 text-blue-600 text-sm hover:text-blue-500">
                    <Upload size={16} className="inline mr-1" />Upload images
                  </p>
                )}
              </label>
              {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}
            </div>

            {errors.submit && (
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-red-500">{errors.submit}</p>
              </div>
            )}

            <div className="flex justify-center sm:justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg flex items-center justify-center">
            <Circles
              height={80}
              width={80}
              color="#3B82F6"
              ariaLabel="loading"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AddItemsPage;