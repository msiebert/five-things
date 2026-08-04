---
layout: default
title: Home
---
<section class="hero">
  <p class="hero-eyebrow">A daily learning journal</p>
  <h1>{{ site.title }}</h1>
  <p class="hero-description">{{ site.description }}</p>
</section>

{% assign daily_pages = site.pages | where_exp: "p", "p.url contains '/daily/'" | sort: "date" | reverse %}

<section class="latest" id="latest">
  {% if daily_pages.size > 0 %}
    {% assign latest = daily_pages.first %}
    <h2 class="section-heading">Today's five things</h2>
    <a class="latest-card" href="{{ latest.url | relative_url }}">
      <span class="latest-date">{{ latest.date | date: "%A, %B %-d, %Y" }}</span>
      <span class="latest-title">{% if latest.topic %}{{ latest.topic }}{% else %}Five things to learn{% endif %}</span>
      <span class="latest-cta">Read today's entry &rarr;</span>
    </a>
  {% endif %}
</section>

<section class="archive">
  <h2 class="section-heading">The journal so far</h2>
  <ol class="archive-list">
    {% for entry in daily_pages %}
      <li class="archive-item">
        <a href="{{ entry.url | relative_url }}">
          <span class="archive-date">{{ entry.date | date: "%b %-d, %Y" }}</span>
          <span class="archive-title">{% if entry.topic %}{{ entry.topic }}{% else %}Five things to learn{% endif %}</span>
        </a>
      </li>
    {% endfor %}
  </ol>
</section>

<section class="quiz" id="quiz">
  <h2 class="section-heading">Take‑25 quiz</h2>
  <p class="quiz-copy">
    Twenty-five questions drawn from everything you've learned so far
    across every daily entry, weighted toward what you've recently missed.
  </p>
  <a class="latest-cta" href="{{ '/take-25/' | relative_url }}">Take today's quiz &rarr;</a>
</section>
