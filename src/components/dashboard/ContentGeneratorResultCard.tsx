
import React from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

type ContentGeneratorResultCardProps = {
  title: string;
  content: string | string[];
};

const ContentGeneratorResultCard: React.FC<ContentGeneratorResultCardProps> = ({
  title,
  content,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const textToCopy = Array.isArray(content) ? content.join("\n\n") : content;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: `${title} content has been copied to your clipboard.`,
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <button
          onClick={handleCopy}
          className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          aria-label="Copy content"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>
      <div className="flex-grow overflow-y-auto text-white/80 prose prose-invert max-w-full">
        {Array.isArray(content) ? (
          <ul className="space-y-2 list-disc pl-5">
            {content.map((item, index) => (
              <li key={index} className="text-white/80">{item}</li>
            ))}
          </ul>
        ) : (
          <div className="whitespace-pre-wrap">{content}</div>
        )}
      </div>
    </div>
  );
};

export default ContentGeneratorResultCard;
