'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Cpu, 
  User, 
  CornerDownRight, 
  Send,
  Loader2
} from 'lucide-react';
import type { CommentResponse } from '@zkgov/shared';

interface DiscussionSectionProps {
  proposalId: number;
}

export function DiscussionSection({ proposalId }: DiscussionSectionProps) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/proposals/${proposalId}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    
    // Listen for new comments via SSE
    const eventSource = new EventSource(`${API_URL}/api/sse/proposals/${proposalId}`);
    eventSource.addEventListener('comment_added', () => {
      fetchComments();
    });
    return () => eventSource.close();
  }, [proposalId]);

  const handlePostComment = async () => {
    if (!token || !newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/proposals/${proposalId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const CommentItem = ({ comment, isReply = false }: { comment: CommentResponse, isReply?: boolean }) => (
    <div className={cn("flex flex-col gap-4", isReply && "ml-8 mt-4")}>
      <div className="flex gap-4 group">
        {isReply && <CornerDownRight size={14} className="text-zinc-700 shrink-0 mt-1" />}
        <div className={cn(
          "w-8 h-8 rounded-sm flex items-center justify-center shrink-0 border border-white/5",
          comment.author.type === 'agent' ? "bg-indigo-500/10 text-indigo-400" : "bg-white/5 text-zinc-500"
        )}>
          {comment.author.type === 'agent' ? <Cpu size={14} /> : <User size={14} />}
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              comment.author.type === 'agent' ? "text-indigo-400" : "text-white"
            )}>
              {comment.author.displayName}
            </span>
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">•</span>
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-tight">
              {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {comment.commentType === 'analysis' && (
              <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 rounded-sm uppercase tracking-widest ml-auto">
                AI ANALYSIS
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed font-mono">
            {comment.content}
          </p>
        </div>
      </div>
      {comment.replies?.map(reply => (
        <CommentItem key={reply.id} comment={reply} isReply />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-8 mt-12 animate-in delay-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-900 dark:text-white flex items-center gap-3">
          <MessageSquare size={18} className="text-zinc-500" />
          Discussion
        </h2>
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
          {comments.length} THREADS ACTIVE
        </span>
      </div>

      <Separator className="bg-white/[0.06]" />

      {/* Post Comment Area */}
      {user ? (
        <div className="flex flex-col gap-4 p-6 bg-[#EBE8E1] dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-sm">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Post a thought</label>
            <textarea 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="YOUR PERSPECTIVE MATTERS..."
              className="w-full bg-[#F5F2EB] dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-sm p-4 text-sm font-mono text-zinc-300 focus:border-indigo-500/50 outline-none transition-colors resize-none h-24"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-600">
              <User size={12} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Posting as {user.walletAddress.slice(0, 6)}...</span>
            </div>
            <Button 
              onClick={handlePostComment}
              disabled={isSubmitting || !newComment.trim()}
              className="bg-indigo-500 hover:bg-indigo-600 text-zinc-900 dark:text-white font-bold text-[10px] uppercase tracking-[0.2em] h-9 px-6"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={14} /> : <Send size={14} className="mr-2" />}
              POST MESSAGE
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-8 border border-dashed border-black/[0.06] dark:border-white/[0.06] rounded-sm flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-xs text-zinc-600 uppercase tracking-widest font-bold">Sign in to participate in the debate</p>
        </div>
      )}

      {/* Comment List */}
      <div className="flex flex-col gap-10">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-8 h-8 bg-white/5 rounded-sm"></div>
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-3 w-32 bg-white/5 rounded"></div>
                <div className="h-12 w-full bg-white/5 rounded"></div>
              </div>
            </div>
          ))
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        ) : (
          <div className="py-12 flex flex-col items-center text-center gap-4 opacity-30">
            <MessageSquare size={32} strokeWidth={1} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">No activity yet</span>
          </div>
        )}
      </div>
    </div>
  );
}
