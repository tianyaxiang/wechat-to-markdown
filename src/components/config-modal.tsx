'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Textarea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui';

interface ConfigData {
  githubRepo: string;
  githubToken: string;
  githubBranch: string;
  markdownDir: string;
  imagesDir: string;
  markdownTemplate: string;
}

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConfigData;
  onSave: (config: ConfigData) => void;
}

// Default values to ensure inputs are always controlled
const DEFAULT_VALUES = {
  githubRepo: '',
  githubToken: '',
  githubBranch: '',
  markdownDir: 'articles',
  imagesDir: 'images',
  markdownTemplate: '---\ntitle: {{title}}\ndate: {{date}}\nsource: {{source}}\n---\n\n'
};

export default function ConfigModal({ isOpen, onClose, config, onSave }: ConfigModalProps) {
  // Initialize with default values to ensure all fields have defined values
  const [formData, setFormData] = useState<ConfigData>({
    githubRepo: config.githubRepo || DEFAULT_VALUES.githubRepo,
    githubToken: config.githubToken || DEFAULT_VALUES.githubToken,
    githubBranch: config.githubBranch || DEFAULT_VALUES.githubBranch,
    markdownDir: config.markdownDir || DEFAULT_VALUES.markdownDir,
    imagesDir: config.imagesDir || DEFAULT_VALUES.imagesDir,
    markdownTemplate: config.markdownTemplate || DEFAULT_VALUES.markdownTemplate
  });
  
  // Update form data when config changes
  useEffect(() => {
    setFormData({
      githubRepo: config.githubRepo || DEFAULT_VALUES.githubRepo,
      githubToken: config.githubToken || DEFAULT_VALUES.githubToken,
      githubBranch: config.githubBranch || DEFAULT_VALUES.githubBranch,
      markdownDir: config.markdownDir || DEFAULT_VALUES.markdownDir,
      imagesDir: config.imagesDir || DEFAULT_VALUES.imagesDir,
      markdownTemplate: config.markdownTemplate || DEFAULT_VALUES.markdownTemplate
    });
  }, [config]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] w-[90vw]">
        <DialogHeader>
          <DialogTitle>Configuration Settings</DialogTitle>
          <DialogDescription>
            Configure GitHub synchronization and Markdown template settings.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="mt-4">
          <Tabs defaultValue="github" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="github">GitHub Sync</TabsTrigger>
              <TabsTrigger value="template">Markdown Template</TabsTrigger>
            </TabsList>
            
            <TabsContent value="github" className="space-y-5 py-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="githubRepo" className="text-base">GitHub Repository</Label>
                  <Input
                    id="githubRepo"
                    name="githubRepo"
                    placeholder="username/repository"
                    value={formData.githubRepo}
                    onChange={handleChange}
                    className="h-10"
                  />
                  <p className="text-sm text-slate-500">
                    Format: username/repository (e.g., yourusername/my-articles)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="githubBranch" className="text-base">Default Branch</Label>
                  <Input
                    id="githubBranch"
                    name="githubBranch"
                    placeholder="main"
                    value={formData.githubBranch}
                    onChange={handleChange}
                    className="h-10"
                  />
                  <p className="text-sm text-slate-500">
                    Optional, leave empty for default
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="githubToken" className="text-base">GitHub Personal Access Token</Label>
                <Input
                  id="githubToken"
                  name="githubToken"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={formData.githubToken}
                  onChange={handleChange}
                  className="h-10"
                />
                <p className="text-sm text-slate-500">
                  Create a token with 'repo' scope at{' '}
                  <a 
                    href="https://github.com/settings/tokens" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    GitHub Settings
                  </a>
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="markdownDir" className="text-base">Markdown Directory</Label>
                  <Input
                    id="markdownDir"
                    name="markdownDir"
                    placeholder="articles"
                    value={formData.markdownDir}
                    onChange={handleChange}
                    className="h-10"
                  />
                  <p className="text-sm text-slate-500">
                    Directory where Markdown files will be saved
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="imagesDir" className="text-base">Images Directory</Label>
                  <Input
                    id="imagesDir"
                    name="imagesDir"
                    placeholder="images"
                    value={formData.imagesDir}
                    onChange={handleChange}
                    className="h-10"
                  />
                  <p className="text-sm text-slate-500">
                    Directory where images will be saved
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="template" className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="markdownTemplate" className="text-base">Markdown Header Template</Label>
                <Textarea
                  id="markdownTemplate"
                  name="markdownTemplate"
                  placeholder="---
title: {{title}}
date: {{date}}
source: {{source}}
---

"
                  value={formData.markdownTemplate}
                  onChange={handleChange}
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-slate-500">
                  Available variables: {'{'}{'{'} title {'}'}{'}'},  {'{'}{'{'} date {'}'}{'}'},  {'{'}{'{'} source {'}'}{'}'}
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="h-10">
              Cancel
            </Button>
            <Button type="submit" className="h-10">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 