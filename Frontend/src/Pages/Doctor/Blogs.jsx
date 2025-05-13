import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useBlogContext } from "../../Context/BlogContext";

const Blogs = () => {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState(null);
  const [content, setContent] = useState("");
  const { uploadBlog } = useBlogContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("bannerImage", image);
    formData.append("content", content);

    await uploadBlog(formData);

    // Reset form
    setTitle("");
    setImage(null);
    setContent("");
  };

  return (
    <>
      <h2 className="text-2xl text-blue-700 font-bold mb-4">Upload Blog</h2>
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2">Blog Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-500"
              placeholder="Enter blog title"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Blog Banner Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Blog Content</label>
            <ReactQuill
              value={content}
              onChange={setContent}
              placeholder="Write your blog content here..."
              theme="snow"
              modules={{
                toolbar: [
                  [{ header: [1, 2, false] }],
                  ["bold", "italic", "underline"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link", "image"],
                  ["clean"],
                ],
              }}
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Submit Blog
          </button>
        </form>
      </div>
    </>
  );
};

export default Blogs;
