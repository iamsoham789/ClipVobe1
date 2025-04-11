import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { canGenerate, updateUsage } from './usageLimits';
import { useToast } from '../../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/use-subscription';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { ScrollText, Copy, Download, Save, Loader2 } from 'lucide-react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface VideoScriptGeneratorProps {
  handleNavigation: (itemId: string, subItemId?: string) => void;
}

const VideoScriptGenerator: React.FC<VideoScriptGeneratorProps> = ({
  handleNavigation,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [formData, setFormData] = useState({
    contentType: '',
    duration: '',
    topic: '',
    targetAudience: '',
    tone: '',
    language: 'English',
    includeCTA: false,
  });
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.contentType) return 'Please select a content type';
    if (!formData.duration) return 'Please select a duration';
    if (!formData.topic) return 'Please enter a topic';
    if (!formData.targetAudience) return 'Please select a target audience';
    if (!formData.tone) return 'Please select a tone';
    return null;
  };

  const generatePrompt = () => {
    const { contentType, duration, topic, targetAudience, tone, language, includeCTA } = formData;
    return `Create a ${contentType} video script about "${topic}" for ${duration} ${
      contentType === 'shorts' ? 'seconds' : 'minutes'
    }.

Target Audience: ${targetAudience}
Tone: ${tone}
Language: ${language}

Please structure the script with:
1. An engaging hook that immediately grabs attention
2. Clear and concise main points
3. Smooth transitions between sections
${includeCTA ? '4. A compelling call-to-action at the end' : ''}

The script should be optimized for ${
      contentType === 'shorts' 
        ? 'vertical video format and quick engagement. Keep sentences short and impactful.' 
        : 'detailed explanation and viewer retention. Include proper pacing and engagement points.'
    }

Format the output with:
- Clear section headers
- Timestamps for each section
- [Hook] section at the start
- [Main Content] in the middle
- ${includeCTA ? '[Call to Action] at the end' : '[Conclusion] to wrap up'}
- Estimated delivery time for each section

Remember to:
- Keep the language ${tone} and suitable for ${targetAudience}
- Use short, punchy sentences for better delivery
- Include natural transition phrases
- ${language !== 'English' ? `Write the entire script in ${language}` : ''}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to generate scripts.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setIsLoading(true);
    const userTier = tier || "free";
    const allowed = await canGenerate(user.id, "scripts", userTier);
    if (!allowed) {
      toast({
        title: "Limit Reached",
        description: "You've reached your script generation limit. Upgrade your plan!",
        variant: "destructive",
      });
      navigate('/pricing');
      setIsLoading(false);
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!GEMINI_API_KEY) {
      setError('Gemini API key is not configured');
      toast({
        title: "Configuration Error",
        description: "Gemini API key is not set",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: generatePrompt()
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
            ]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate script');
      }

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;

      const formattedScript = `Video Script: ${formData.topic}
Type: ${formData.contentType}
Duration: ${formData.duration} ${formData.contentType === 'shorts' ? 'seconds' : 'minutes'}
Target Audience: ${formData.targetAudience}
Tone: ${formData.tone}
Language: ${formData.language}

${generatedText}`;

      setGeneratedScript(formattedScript);
      await updateUsage(user.id, "scripts");
      toast({
        title: "Script Generated Successfully!",
        description: "Would you like to generate SEO-optimized tags for better reach?",
        action: (
          <Button
            variant="default"
            onClick={() => handleNavigation('hashtags')}
            className="bg-clipvobe-cyan text-black hover:bg-clipvobe-cyan/90"
          >
            Generate Tags
          </Button>
        ),
      });
    } catch (error) {
      console.error('Error generating script:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate script');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to generate script',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedScript);
      toast({
        title: "Copied!",
        description: "Script copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy script",
        variant: "destructive",
      });
    }
  };

  const downloadScript = () => {
    try {
      const blob = new Blob([generatedScript], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-script-${Date.now()}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download script",
        variant: "destructive",
      });
    }
  };

  try {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-clipvobe-cyan" />
          <h2 className="text-2xl font-bold text-white">Generate AI Video Script</h2>
        </div>
        {error && (
          <div className="glass-card rounded-xl p-4 bg-red-500/10 border border-red-500/20">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        <div className="glass-card rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contentType">Content Type</Label>
                <Select onValueChange={(value) => handleInputChange('contentType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shorts">Shorts (≤ 60 seconds)</SelectItem>
                    <SelectItem value="longform">Long-form Content (1-10 minutes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select onValueChange={(value) => handleInputChange('duration', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.contentType === 'shorts' ? (
                      <>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">60 seconds</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="1">1 minute</SelectItem>
                        <SelectItem value="2">2 minutes</SelectItem>
                        <SelectItem value="3">3 minutes</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="Enter your video topic or idea"
                  value={formData.topic}
                  onChange={(e) => handleInputChange('topic', e.target.value)}
                  className="bg-clipvobe-gray-800 border-clipvobe-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Select onValueChange={(value) => handleInputChange('targetAudience', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="kids">Kids</SelectItem>
                    <SelectItem value="professionals">Professionals</SelectItem>
                    <SelectItem value="gamers">Gamers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select onValueChange={(value) => handleInputChange('tone', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="humorous">Humorous</SelectItem>
                    <SelectItem value="informative">Informative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  defaultValue={formData.language}
                  onValueChange={(value) => handleInputChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="Portuguese">Portuguese</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCTA"
                  checked={formData.includeCTA}
                  onCheckedChange={(checked) => handleInputChange('includeCTA', !!checked)}
                />
                <Label htmlFor="includeCTA">Include Call-to-Action</Label>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-clipvobe-cyan text-black hover:bg-clipvobe-cyan/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Script"
              )}
            </Button>
          </form>
        </div>
        {generatedScript && (
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Generated Script</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  className="text-clipvobe-cyan hover:text-clipvobe-cyan/90"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={downloadScript}
                  className="text-clipvobe-cyan hover:text-clipvobe-cyan/90"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleNavigation('hashtags')}
                  className="text-clipvobe-cyan hover:text-clipvobe-cyan/90"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Textarea
              value={generatedScript}
              readOnly
              className="min-h-[300px] bg-clipvobe-gray-800 border-clipvobe-gray-700 font-mono"
            />
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error in VideoScriptGenerator:', error);
    return (
      <div className="text-red-500 p-4">
        An error occurred in the Video Script Generator. Please check the console for details.
      </div>
    );
  }
};

export default VideoScriptGenerator;