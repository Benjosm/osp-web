import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type Media = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  createdAt: string;
  location?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

type Comment = {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
};

const MediaDetailPage: React.FC = () => {
  const { id: mediaId } = useParams<{ id: string }>();
  const [media, setMedia] = useState<Media | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingMedia, setLoadingMedia] = useState<boolean>(true);
  const [loadingComments, setLoadingComments] = useState<boolean>(true);
  const [loadingPostComment, setLoadingPostComment] = useState<boolean>(false);
  const [errorMedia, setErrorMedia] = useState<string | null>(null);
  const [errorComments, setErrorComments] = useState<string | null>(null);
  const [errorPostComment, setErrorPostComment] = useState<string | null>(null);

  useEffect(() => {
    if (!mediaId) return;
  
    const fetchMedia = async () => {
      setLoadingMedia(true);
      setErrorMedia(null);
      try {
        const response = await fetch(`${API_BASE_URL}/media/${mediaId}`);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data: Media = await response.json();
        setMedia(data);
      } catch (error) {
        setErrorMedia('Failed to load media. Please try again.');
        console.error("Failed to fetch media:", error);
      } finally {
        setLoadingMedia(false);
      }
    };
  
    const fetchComments = async () => {
      setLoadingComments(true);
      setErrorComments(null);
      try {
        const response = await fetch(`${API_BASE_URL}/comments/${mediaId}`);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data: Comment[] = await response.json();
        setComments(data);
      } catch (error) {
        setErrorComments('Failed to load comments. Please try again.');
        console.error("Failed to fetch comments:", error);
      } finally {
        setLoadingComments(false);
      }
    };
  
    const retryFetchMedia = async () => {
      await fetchMedia();
    };
  
    const retryFetchComments = async () => {
      await fetchComments();
    };

    const retryPostComment = async (text: string) => {
      if (!mediaId) return;
      
      const token = localStorage.getItem('token');
      if (!token) return;

      setErrorPostComment(null);
      setLoadingPostComment(true);
      
      try {
        const response = await fetch(`${API_BASE_URL}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mediaId, text }),
        });

        if (response.ok) {
          const newComment: Comment = await response.json();
          setComments((prev) => [newComment, ...prev]);
          setErrorPostComment(null);
        } else {
          throw new Error(`Error: ${response.status}`);
        }
      } catch (error) {
        setErrorPostComment('Failed to post comment. Please try again.');
        console.error('Error posting comment:', error);
      } finally {
        setLoadingPostComment(false);
      }
    };
  
    fetchMedia();
    fetchComments();

    // Make retry functions available to the component
    (window as any).retryFetchMedia = retryFetchMedia;
    (window as any).retryFetchComments = retryFetchComments;
    (window as any).retryPostComment = retryPostComment;
  }, [mediaId]);

  // Handle media fetch errors
  if (errorMedia) {
    return (
      <div style={{ textAlign: "center", margin: "40px 0" }}>
        <p style={{ color: "#dc3545", marginBottom: "10px" }}>{errorMedia}</p>
        <button
          onClick={() => (window as any).retryFetchMedia()}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }
  
  // Handle comments fetch errors when media is loaded
  if (errorComments && media) {
    return (
      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <p style={{ color: "#dc3545", marginBottom: "10px" }}>{errorComments}</p>
        <button
          onClick={() => (window as any).retryFetchComments()}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }
  
  // Handle comment submission errors
  if (errorPostComment) {
    return (
      <div style={{
        margin: "20px auto",
        maxWidth: "500px",
        textAlign: "center",
        color: "#dc3545",
        padding: "15px",
        borderRadius: "4px",
        backgroundColor: "#f8d7da",
        border: "1px solid #f5c6cb",
      }}>
        <p style={{ margin: "0 0 10px 0" }}>{errorPostComment}</p>
        <button
          onClick={() => {
            const form = document.querySelector("form");
            const textarea = form?.elements.namedItem("commentText") as HTMLTextAreaElement;
            if (textarea?.value.trim()) {
              (window as any).retryPostComment(textarea.value.trim());
            }
          }}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const isLoading = loadingMedia || loadingComments;
  
  if (isLoading) {
    return <LoadingSpinner message="Loading media details..." />;
  }
  
  if (!media) {
    return <div>Media not found.</div>;
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <h1>OSP Platform</h1>
        <nav>
          <a href="/" style={{ marginRight: '15px' }}>Home</a>
          <a href="/account-settings" style={{ marginRight: '15px' }}>Account</a>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/';
            }}
            style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </nav>
      </header>
      <main>
        <h2>{media.title}</h2>
        <p><strong>Description:</strong> {media.description}</p>
        <img
          src={media.thumbnailUrl}
          alt={media.title}
          style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
        />
        <p><strong>Uploaded:</strong> {new Date(media.createdAt).toLocaleString()}</p>
        {media.location && <p><strong>Location:</strong> {media.location}</p>}
        {media.coordinates && (
          <p>
            <strong>Coordinates:</strong> {media.coordinates.latitude}, {media.coordinates.longitude}
          </p>
        )}
      </main>

      <section style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <h3>Comments</h3>
        {comments.length === 0 ? (
          <p>No comments yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {comments.map((comment) => (
              <li key={comment.id} style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #f0f0f0' }}>
                <p style={{ margin: '5px 0', whiteSpace: 'pre-wrap' }}>{comment.text}</p>
                <small style={{ color: '#888' }}>
                  {new Date(comment.createdAt).toLocaleString()}
                </small>
              </li>
            ))}
          </ul>
        )}

        {/* Comment Form - Only shown if user is authenticated */}
        {localStorage.getItem('token') && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const textarea = form.elements.namedItem('commentText') as HTMLTextAreaElement;
              const text = textarea.value.trim();
              if (!text || !mediaId) return;

              const token = localStorage.getItem('token');
              if (!token) return;

              setErrorPostComment(null);
              
              try {
                const response = await fetch('/api/v1/comments', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ mediaId, text }),
                });

                if (response.ok) {
                  const newComment: Comment = await response.json();
                  setComments((prev) => [newComment, ...prev]);
                  textarea.value = '';
                  setErrorPostComment(null);
                } else {
                  throw new Error(`Error: ${response.status}`);
                }
              } catch (error) {
                const errorMsg = 'Failed to post comment. Please try again.';
                setErrorPostComment(errorMsg);
                console.error('Error posting comment:', error);
              }
            }}
            style={{
              marginTop: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <textarea
              name="commentText"
              placeholder="Add a comment..."
              required
              rows={3}
              style={{
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                resize: 'vertical',
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              Post Comment
            </button>
          </form>
        )}
      </section>
    </div>
  );
};

export default MediaDetailPage;
