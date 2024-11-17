import { useTheme } from '@/contexts/ThemeContext';

export default function CreateBlog() {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <h1 className="text-3xl font-bold mb-6">Create New Blog</h1>
      <p>Create blog page</p>
    </div>
  );
}
