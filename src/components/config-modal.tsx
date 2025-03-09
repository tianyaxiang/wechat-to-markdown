'use client';

import { useState } from 'react';
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
  markdownTemplate: string;
}

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConfigData;
  onSave: (config: ConfigData) => void;
}

export default function ConfigModal({ isOpen, onClose, config, onSave }: ConfigModalProps) {
  const [formData, setFormData] = useState<ConfigData>(config);
  
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configuration Settings</DialogTitle>
          <DialogDescription>
            Configure GitHub synchronization and Markdown template settings.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="github" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="github">GitHub Sync</TabsTrigger>
              <TabsTrigger value="template">Markdown Template</TabsTrigger>
            </TabsList>
            
            <TabsContent value="github" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="githubRepo">GitHub Repository</Label>
                <Input
                  id="githubRepo"
                  name="githubRepo"
                  placeholder="username/repository"
                  value={formData.githubRepo}
                  onChange={handleChange}
                />
                <p className="text-sm text-slate-500">
                  Format: username/repository (e.g., yourusername/my-articles)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="githubToken">GitHub Personal Access Token</Label>
                <Input
                  id="githubToken"
                  name="githubToken"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={formData.githubToken}
                  onChange={handleChange}
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
            </TabsContent>
            
            <TabsContent value="template" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="markdownTemplate">Markdown Header Template</Label>
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
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-slate-500">
                  Available variables: {'{'}{'{'} title {'}'}{'}'},  {'{'}{'{'} date {'}'}{'}'},  {'{'}{'{'} source {'}'}{'}'}
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 