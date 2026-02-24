import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { getFeed, createPost, deletePost, reactPost, addComment, delComment } from '../services/feed';

const LOGO = 'http://www.lovirtual.com/wp-content/uploads/2023/09/cropped-LOGO-LOVIRTUAL-SIN-FONDO-1.png';
const EMOJIS = ['👍','❤️','🎉','🔥','💪'];

const ROLE_COLORS = {
  admin:      { bg: 'rgba(168,85,247,0.15)', color: '#c084fc' },
  supervisor: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
  employee:   { bg: 'rgba(6,182,212,0.12)',  color: '#67e8f9' },
};

/* ── Avatar de letra ── */
const Av = ({ name, role, size = 38 }) => {
  const rc = ROLE_COLORS[role] || ROLE_COLORS.employee;
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2.5,
      background: rc.bg, border: `1px solid ${rc.color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.42, color: rc.color,
      flexShrink: 0
    }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
};

/* ── Tiempo relativo ── */
const useTimeAgo = (t) => (ds) => {
  const diff = Math.floor((Date.now() - new Date(ds)) / 1000);
  if (diff < 60)   return t('feed.justNow');
  if (diff < 3600) return t('feed.minutesAgo').replace('{m}', Math.floor(diff/60));
  if (diff < 86400)return t('feed.hoursAgo').replace('{h}', Math.floor(diff/3600));
  return t('feed.daysAgo2').replace('{d}', Math.floor(diff/86400));
};

/* ── Componente de un post ── */
const Post = ({ post, me, t, timeAgo, onDelete, onReact, onComment, onDelComment }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText]   = useState('');
  const [sendingCmt, setSendingCmt]     = useState(false);
  const inputRef = useRef(null);
  const rc = ROLE_COLORS[post.role] || ROLE_COLORS.employee;
  const canDelete = me.id === post.user_id || me.role === 'admin';
  const totalComments = post.comments?.length || 0;

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSendingCmt(true);
    await onComment(post.id, commentText.trim());
    setCommentText('');
    setSendingCmt(false);
  };

  return (
    <div className="card p-5 animate-fade-up" style={{ borderRadius: 20 }}>
      {/* ── Cabecera ── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <Av name={post.username} role={post.role} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{post.username}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: rc.bg, color: rc.color }}>
                {t(`feed.roles.${post.role}`) || post.role}
              </span>
              {post.group && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(6,182,212,0.1)', color: '#67e8f9' }}>
                  Grupo {post.group}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {post.client && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {t('feed.client')}: <span style={{ color: 'var(--cyan)' }}>{post.client}</span>
                </span>
              )}
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>· {timeAgo(post.created_at)}</span>
            </div>
          </div>
        </div>
        {canDelete && (
          <button onClick={() => onDelete(post.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0"
            style={{ color: 'var(--text-dim)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Contenido ── */}
      <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4" style={{ color: 'var(--text)' }}>
        {post.content}
      </p>

      {/* ── Reacciones ── */}
      <div className="flex items-center gap-1.5 flex-wrap pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        {EMOJIS.map(emoji => {
          const count = post.reaction_counts?.[emoji] || 0;
          const active = post.my_reaction === emoji;
          return (
            <button key={emoji} onClick={() => onReact(post.id, emoji)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all"
              style={{
                background: active ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.04)',
                border: active ? '1px solid rgba(6,182,212,0.3)' : '1px solid var(--border)',
                color: active ? 'var(--cyan)' : 'var(--text-muted)'
              }}>
              <span>{emoji}</span>
              {count > 0 && <span>{count}</span>}
            </button>
          );
        })}

        {/* Botón comentarios */}
        <button onClick={() => { setShowComments(v => !v); setTimeout(()=>inputRef.current?.focus(),100); }}
          className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {totalComments > 0 && <span>{totalComments}</span>}
          <span>{showComments ? t('feed.hideComments') : (totalComments > 0 ? t('feed.viewComments') : t('feed.comment'))}</span>
        </button>
      </div>

      {/* ── Comentarios ── */}
      {showComments && (
        <div className="pt-3 space-y-3">
          {post.comments?.map(c => {
            const crc = ROLE_COLORS[c.role] || ROLE_COLORS.employee;
            const canDelCmt = me.id === c.user_id || me.role === 'admin';
            return (
              <div key={c.id} className="flex items-start gap-2.5">
                <Av name={c.username} role={c.role} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="inline-block rounded-2xl rounded-tl-sm px-3 py-2 max-w-full"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-semibold">{c.username}</span>
                      <span className="text-xs px-1.5 py-px rounded-full"
                        style={{ background: crc.bg, color: crc.color, fontSize: 10 }}>
                        {t(`feed.roles.${c.role}`) || c.role}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text)' }}>{c.content}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 px-1">
                    <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{timeAgo(c.created_at)}</span>
                    {canDelCmt && (
                      <button onClick={() => onDelComment(post.id, c.id)}
                        className="text-xs hover:text-red-400 transition-colors"
                        style={{ color: 'var(--text-dim)' }}>
                        {t('common.delete')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Input comentario */}
          <form onSubmit={submitComment} className="flex items-center gap-2 pt-1">
            <Av name={me.username} role={me.role} size={28} />
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <input ref={inputRef} type="text" value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder={t('feed.commentPlaceholder')}
                disabled={sendingCmt}
                className="flex-1 bg-transparent border-none outline-none text-sm"
                style={{ color: 'var(--text)' }} />
              <button type="submit" disabled={!commentText.trim() || sendingCmt}
                className="flex-shrink-0 p-1 rounded-lg transition-colors"
                style={{ color: commentText.trim() ? 'var(--cyan)' : 'var(--text-dim)' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

/* ── Página principal ── */
const Feed = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { t }     = useLang();
  const timeAgo   = useTimeAgo(t);

  const [posts,      setPosts]      = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [content,    setContent]    = useState('');
  const [isPosting,  setIsPosting]  = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  useEffect(() => { load(); }, []);

  const flash = (msg, type='success') => {
    if (type==='success') { setSuccess(msg); setTimeout(()=>setSuccess(''),3000); }
    else                  { setError(msg);   setTimeout(()=>setError(''),4000);   }
  };

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await getFeed();
      setPosts(res?.data ?? []);
    } catch (e) { flash(e.message || 'Error al cargar', 'error'); }
    finally { setIsLoading(false); }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsPosting(true);
    try {
      await createPost({ content });
      setContent('');
      flash('Publicación creada');
      await load();
    } catch (e) { flash(e.message || 'Error al publicar', 'error'); }
    finally { setIsPosting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('feed.deletePost'))) return;
    try { await deletePost(id); await load(); }
    catch (e) { flash(e.message || 'Error', 'error'); }
  };

  const handleReact = async (postId, emoji) => {
    try {
      const res = await reactPost(postId, emoji);
      if (res?.success) {
        setPosts(prev => prev.map(p => p.id === postId
          ? { ...p, reaction_counts: res.reaction_counts, my_reaction: res.my_reaction }
          : p
        ));
      }
    } catch {}
  };

  const handleComment = async (postId, text) => {
    try {
      const res = await addComment(postId, text);
      if (res?.success) {
        setPosts(prev => prev.map(p => p.id === postId
          ? { ...p, comments: [...(p.comments || []), res.data] }
          : p
        ));
      }
    } catch (e) { flash(e.message || 'Error', 'error'); }
  };

  const handleDelComment = async (postId, cid) => {
    if (!confirm(t('feed.deleteComment'))) return;
    try {
      await delComment(postId, cid);
      setPosts(prev => prev.map(p => p.id === postId
        ? { ...p, comments: p.comments.filter(c => c.id !== cid) }
        : p
      ));
    } catch (e) { flash(e.message || 'Error', 'error'); }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Header ── */}
      <header className="page-header">
        <div className="px-5 py-3.5 flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => navigate('/')} className="btn btn-ghost p-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <img src={LOGO} alt="LoVirtual" className="lv-logo" />
          <div>
            <h1 className="font-bold">{t('feed.title')}</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('feed.subtitle')}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-4">

        {/* Alertas */}
        {error   && <div className="alert-error  flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>{error}</div>}
        {success && <div className="alert-success flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>{success}</div>}

        {/* ── Crear post ── */}
        <div className="card p-5" style={{ borderRadius: 20 }}>
          <div className="flex items-start gap-3">
            <Av name={user?.username} role={user?.role} />
            <form onSubmit={handlePost} className="flex-1 space-y-3">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={t('feed.placeholder')}
                rows={3}
                disabled={isPosting}
                className="field resize-none w-full"
                style={{ borderRadius: 14 }}
              />
              {content.trim() && (
                <div className="flex justify-end">
                  <button type="submit" disabled={isPosting} className="btn btn-primary">
                    {isPosting
                      ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>{t('feed.posting')}</>
                      : t('feed.post')
                    }
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* ── Feed ── */}
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="card p-12 text-center" style={{ borderRadius: 20 }}>
            <div className="text-4xl mb-3">📝</div>
            <p className="font-semibold" style={{ color: 'var(--text-muted)' }}>{t('feed.noFeed')}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>{t('feed.noFeedDesc')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <Post key={post.id} post={post} me={user}
                t={t} timeAgo={timeAgo}
                onDelete={handleDelete}
                onReact={handleReact}
                onComment={handleComment}
                onDelComment={handleDelComment}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Feed;
