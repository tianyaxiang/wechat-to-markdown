'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger, useToast } from '@/components/ui';
import { Copy, FileText, Code } from 'lucide-react';
import { ComponentPropsWithoutRef } from 'react';

interface MarkdownPreviewProps {
  markdown: string;
}

// Define types for ReactMarkdown components
type ReactMarkdownProps = ComponentPropsWithoutRef<typeof ReactMarkdown>;
type ComponentType = NonNullable<ReactMarkdownProps['components']>;

interface CodeProps extends ComponentPropsWithoutRef<'code'> {
  inline?: boolean;
  node?: any;
}

interface MarkdownComponentProps {
  node?: any;
  [key: string]: any;
}

export default function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
    toast({
      title: "Copied to clipboard",
      description: "Markdown content has been copied to your clipboard.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="lg"
          onClick={copyToClipboard}
          className="flex items-center gap-2"
        >
          <Copy className="h-5 w-5" />
          Copy Markdown
        </Button>
      </div>

      <Tabs defaultValue="preview">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="source" className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Source
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-6">
          <div className="bg-white p-8 rounded-md border shadow-md markdown-body overflow-auto max-h-[700px] dark:bg-slate-900 dark:border-slate-800">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                img: ({node, ...props}: MarkdownComponentProps) => (
                  <img className="max-w-full h-auto my-6 rounded-md shadow-md" {...props} alt={props.alt || 'Image'} />
                ),
                h1: ({node, ...props}: MarkdownComponentProps) => <h1 className="text-3xl font-bold my-6 pb-2 border-b border-gray-200 dark:border-gray-700" {...props} />,
                h2: ({node, ...props}: MarkdownComponentProps) => <h2 className="text-2xl font-bold my-5 pb-1 border-b border-gray-200 dark:border-gray-700" {...props} />,
                h3: ({node, ...props}: MarkdownComponentProps) => <h3 className="text-xl font-bold my-4" {...props} />,
                p: ({node, ...props}: MarkdownComponentProps) => <p className="my-4 text-base leading-relaxed" {...props} />,
                a: ({node, ...props}: MarkdownComponentProps) => <a className="text-blue-600 hover:underline dark:text-blue-400" {...props} />,
                blockquote: ({node, ...props}: MarkdownComponentProps) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-6 text-gray-700 dark:text-gray-300 dark:border-gray-600" {...props} />,
                ul: ({node, ...props}: MarkdownComponentProps) => <ul className="list-disc ml-6 my-4 space-y-2" {...props} />,
                ol: ({node, ...props}: MarkdownComponentProps) => <ol className="list-decimal ml-6 my-4 space-y-2" {...props} />,
                li: ({node, ...props}: MarkdownComponentProps) => <li className="my-1" {...props} />,
                code: ({node, inline, ...props}: CodeProps) =>
                  inline ?
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:bg-gray-800 dark:text-gray-200" {...props} /> :
                    <pre className="bg-gray-100 p-4 rounded-md overflow-auto my-6 shadow-inner dark:bg-gray-800 dark:text-gray-200">
                      <code className="font-mono text-sm" {...props} />
                    </pre>
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </TabsContent>

        <TabsContent value="source" className="mt-6">
          <pre className="bg-gray-100 p-8 rounded-md overflow-auto max-h-[700px] text-base font-mono shadow-md dark:bg-gray-800 dark:text-gray-200">
            {markdown}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
} 