import { get, post, del } from './api';

export const getFeed    = ()           => get('/feed');
export const createPost = (data)       => post('/feed', data);
export const deletePost = (id)         => del(`/feed/${id}`);
export const reactPost  = (id, emoji)  => post(`/feed/${id}/react`, { emoji });
export const addComment = (id, content)=> post(`/feed/${id}/comment`, { content });
export const delComment = (id, cid)    => del(`/feed/${id}/comment/${cid}`);
