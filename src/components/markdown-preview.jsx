'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Copy } from 'lucide-react';

export default function MarkdownPreview({ markdown }) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
    toast({
      title: "Copied to clipboard",
      description: "Markdown content has been copied to your clipboard.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="flex items-center gap-1"
        >
          <Copy className="h-4 w-4" />
          Copy Markdown
        </Button>
      </div>

      <Tabs defaultValue="preview">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="source">Source</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-4">
          <div className="bg-white p-6 rounded-md border markdown-body overflow-auto max-h-[600px]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                img: ({node, ...props}) => (
                  <img className="max-w-full h-auto my-4 rounded" {...props} alt={props.alt || 'Image'} />
                ),
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold my-3" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-bold my-3" {...props} />,
                p: ({node, ...props}) => <p className="my-2" {...props} />,
                a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-200 pl-4 italic my-4" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc ml-6 my-3" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal ml-6 my-3" {...props} />,
                code: ({node, inline, ...props}) =>
                  inline ?
                    <code className="bg-gray-100 px-1 rounded text-sm" {...props} /> :
                    <pre className="bg-gray-100 p-3 rounded overflow-auto my-4"><code {...props} /></pre>
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </TabsContent>

        <TabsContent value="source" className="mt-4">
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[600px] text-sm">
            {markdown}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}