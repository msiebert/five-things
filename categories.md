---
layout: default
title: Categories
permalink: /categories/
---
<section class="hero">
  <p class="hero-eyebrow">Browse by topic</p>
  <h1>Categories</h1>
  <p class="hero-description">
    Every daily entry is tagged with a topic bucket. Browse past entries by
    category, or head back to the <a href="{{ '/' | relative_url }}">full
    journal</a>.
  </p>
</section>

<section class="archive">
  <ol class="archive-list">
    {% assign categories = site.pages | where_exp: "p", "p.url contains '/category/'" | sort: "title" %}
    {% for cat in categories %}
      <li class="archive-item">
        <a href="{{ cat.url | relative_url }}">
          <span class="archive-title">{{ cat.title }}</span>
        </a>
      </li>
    {% endfor %}
  </ol>
</section>
