import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

// Define TypeScript interface for blog posts
interface BlogPost {
  id: number;
  category: string[];
  title: string;
  description: string;
  author: string;
  date: string;
  image: string;
  fullContent?: string;
  readTime?: string;
}

// Blog posts data
const blogPosts: BlogPost[] = [
  {
    id: 1,
    category: ["Announcement", "Updates"],
    title: "Introducing ClipVobe: Your AI-Powered Content Creation Assistant",
    description:
      "Coming Soon",
    author: "Sarvagya Gupta",
    date: "15 Feb 2024",
    readTime: "3 min read",
    image:
      "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&q=80",
    fullContent: `<p>Coming Soon: The ClipVobe Blog</p>
<p>We're excited to share our knowledge, insights, and expertise with you! Our blog is currently under development and will be launching soon. Stay tuned for updates, tips, and stories from the world of content creation and Ai.</p>`,
  },      
  {
    id: 2,
    category: ["Tutorial", "Tips"],
    title: "5 Ways to Boost Your Content Engagement with AI",
    description:
      "Discover how to leverage AI tools to increase engagement on your content across multiple platforms.",
    author: "Alex Johnson",
    date: "20 Feb 2024",
    readTime: "5 min read",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
    fullContent: `<p>AI is revolutionizing how creators engage with their audience. Here are 5 ways you can use AI to boost your content engagement:</p>
<p>1. Generate attention-grabbing titles</p>
<p>2. Create SEO-optimized descriptions</p>
<p>3. Use AI to find trending hashtags</p>
<p>4. Generate content ideas based on current trends</p>
<p>5. Optimize posting schedules with AI analytics</p>
<p>Stay tuned for more detailed guides on each of these strategies!</p>`,
  },
  {
    id: 3,
    category: ["Feature", "How-to"],
    title: "Mastering ClipVobe's Title Generator for Maximum Impact",
    description:
      "Coming Soon",
    author: "Sarvagya Gupta",
    date: "1 Mar 2024",
    readTime: "4 min read",
    image:
      "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=800&q=80",
    fullContent: `<p>Coming soon: A detailed guide on how to get the most out of ClipVobe's title generator feature.</p>`,
  },
];

export default function Blog() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Render the full blog post view
  const renderFullPost = (post: BlogPost) => (
    <div className="max-w-5xl mx-auto py-12 px-4 animate-fadeIn">
      <button
        onClick={() => setSelectedPost(null)}
        className="mb-6 bg-transparent border border-clipvobe-cyan/30 text-clipvobe-cyan px-4 py-2 rounded-full hover:bg-clipvobe-cyan/10 transition-colors duration-300 shadow-glow-sm"
      >
        ← Back to Blog List
      </button>

      <Card className="glass-card border-clipvobe-gray-800 overflow-hidden">
        <div className="w-full h-64 md:h-80 relative">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8">
            <div className="flex gap-3 mb-4">
              {post.category.map((cat) => (
                <span
                  key={cat}
                  className="text-sm font-medium px-3 py-1 rounded-full bg-clipvobe-cyan/20 text-clipvobe-cyan"
                >
                  {cat}
                </span>
              ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {post.title}
            </h1>
            <div className="flex items-center gap-3 text-clipvobe-gray-300 text-sm">
              <span>{post.author}</span>
              <span>•</span>
              <span>{post.date}</span>
              {post.readTime && (
                <>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-8">
          <div className="prose prose-invert max-w-none">
            <div
              className="text-clipvobe-gray-300 leading-relaxed text-lg"
              dangerouslySetInnerHTML={{
                __html: post.fullContent || "Full content coming soon!",
              }}
            />
          </div>

          <div className="mt-12 pt-6 border-t border-clipvobe-gray-800">
            <h3 className="text-xl font-bold mb-4">Share this article</h3>
            <div className="flex gap-4">
              <button className="p-2 rounded-full bg-clipvobe-gray-800 hover:bg-clipvobe-gray-700 transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                </svg>
              </button>
              <button className="p-2 rounded-full bg-clipvobe-gray-800 hover:bg-clipvobe-gray-700 transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path>
                </svg>
              </button>
              <button className="p-2 rounded-full bg-clipvobe-gray-800 hover:bg-clipvobe-gray-700 transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                </svg>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render the blog post list view
  const renderBlogList = () => (
    <div className="max-w-6xl mx-auto py-12 px-4 animate-fadeIn">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-white">ClipVobe Blog</h1>
        <p className="text-clipvobe-gray-300 text-lg max-w-2xl mx-auto">
          Discover the latest insights, tutorials, and updates about content
          creation and AI tools
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogPosts.map((post) => (
          <Card
            key={post.id}
            className="glass-card border-clipvobe-gray-800 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-glow hover:scale-[1.02]"
            onClick={() => setSelectedPost(post)}
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                {post.category.map((cat) => (
                  <span
                    key={cat}
                    className="text-xs font-semibold px-2 py-1 rounded-full bg-clipvobe-cyan/20 text-clipvobe-cyan backdrop-blur-sm"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">
                {post.title}
              </h2>
              <p className="text-clipvobe-gray-300 mb-4 line-clamp-3">
                {post.description}
              </p>

              <div className="flex items-center justify-between text-clipvobe-gray-400 text-sm mt-auto">
                <span>{post.author}</span>
                <div className="flex items-center gap-2">
                  <span>{post.date}</span>
                  {post.readTime && (
                    <>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <button className="px-6 py-3 rounded-full bg-clipvobe-gray-800 text-white hover:bg-clipvobe-gray-700 transition-colors">
          Load More Articles
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-clipvobe-dark">
      {selectedPost ? renderFullPost(selectedPost) : renderBlogList()}
    </div>
  );
}
