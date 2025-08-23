// src/app/services/blog.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  featured: string;     // URL de la imagen destacada (puede venir vacío)
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly api = '/blog/wp-json/wp/v2/posts?per_page=4&_embed';

  constructor(private http: HttpClient) { }

  getLatest(): Observable<BlogPost[]> {
    return this.http.get<any[]>(this.api).pipe(
      map(posts => posts.map(p => ({
        id: p.id,
        slug: p.slug,
        title: p.title.rendered,
        excerpt: p.excerpt.rendered.replace(/<[^>]+>/g, '').slice(0, 120) + '…',
        featured: p._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes?.medium?.source_url
          || p._embedded?.['wp:featuredmedia']?.[0]?.source_url
          || ''
      }))),
      shareReplay(1)    // cache en memoria mientras viva la app
    );
  }
}
