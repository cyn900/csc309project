import React, { useState, useEffect } from "react";

interface Template {
  tID: number;
  title: string;
  explanation: string;
  tags: string[];
  code: string;
  fork: boolean;
  user: string;
}

interface Tag {
  id: number;
  value: string;
}

const CodeTemplateSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [forkedOnly, setForkedOnly] = useState<boolean>(false); // For filtering forked templates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [explanationQuery, setExplanationQuery] = useState<string>("");

  // Fetch tags for filtering
  useEffect(() => {
    fetch("/api/tags")
      .then((response) => response.json())
      .then((data) => setTags(data));
  }, []);

  // Fetch templates based on search query, selected tags, and other filters
  useEffect(() => {
    const fetchTemplates = async () => {
      const queryParams = new URLSearchParams({
        searchQuery,
        tags: selectedTags.join(","),
        forkedOnly: forkedOnly.toString(),
        explanationQuery,
      }).toString();
      const response = await fetch(`/api/templates?${queryParams}`);
      const data = await response.json();
      setTemplates(data);
    };

    fetchTemplates();
  }, [searchQuery, selectedTags, forkedOnly, explanationQuery]);

  // Handle tag filter change
  const handleTagChange = (tagId: number) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tagId)
        ? prevTags.filter((id) => id !== tagId)
        : [...prevTags, tagId]
    );
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-6">
        Search Code Templates
      </h1>

      {/* Search bar */}
      <div className="mb-6">
        <input
          type="text"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Explanation Search */}
      <div className="mb-6">
        <input
          type="text"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search by explanation..."
          value={explanationQuery}
          onChange={(e) => setExplanationQuery(e.target.value)}
        />
      </div>

      {/* Fork filter */}
      <div className="mb-6 flex items-center gap-4">
        <input
          type="checkbox"
          id="forkedOnly"
          checked={forkedOnly}
          onChange={() => setForkedOnly(!forkedOnly)}
          className="h-5 w-5"
        />
        <label htmlFor="forkedOnly" className="text-white text-sm">
          Show Only Forked Templates
        </label>
      </div>

      {/* Tag Filters */}
      <div className="mb-6">
        <h2 className="text-xl text-white">Filter by Tags:</h2>
        <div className="flex flex-wrap gap-4">
          {tags.map((tag) => (
            <div key={tag.id}>
              <label className="text-white">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.id)}
                  onChange={() => handleTagChange(tag.id)}
                  className="mr-2"
                />
                {tag.value}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Template Results */}
      <div>
        {templates.length === 0 ? (
          <p className="text-gray-400">No templates found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.tID}
                className="bg-gray-800 p-4 rounded-lg shadow-lg"
              >
                <h3 className="text-xl font-semibold text-white">
                  {template.title}
                </h3>
                <p className="text-gray-400 mt-2">{template.explanation}</p>
                <div className="flex gap-2 mt-4">
                  {template.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  {template.fork && (
                    <span className="text-blue-400">
                      Forked from another template
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeTemplateSearch;
