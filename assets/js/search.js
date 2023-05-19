import Fuse from 'fuse.js/dist/fuse.basic.esm.js'

const searchInput = document.getElementById('js-searchInput');
const searchResults = document.getElementById('js-searchResults');

// ***********************
// search index (JSON)
//
// create search index with hugo scratch
{{- $scratch := newScratch -}}
{{- $scratch.Set "index" slice -}}
{{- $pages := .Site.RegularPages -}}
{{- $pages = where $pages "Params.private" "!=" "true" -}}
{{- range $pages -}}
{{- $image := "" -}}
  {{- if .Params.imageFeatured -}}
    {{- if ge (len .Params.imageFeatured) 1 -}}
      {{- with .Resources.GetMatch (index .Params.imageFeatured 0) -}}
        {{- $image = .Resize "200x" -}}
        {{- $image = $image.RelPermalink -}}
      {{- end -}}
    {{- end -}}
  {{- end -}}
  {{- $galleryTerms := .GetTerms "gallery" -}}
  {{- $gallery := slice -}}
  {{- range $galleryTerms -}}
    {{- $gallery = $gallery | append (dict "title" (.Title | humanize | title ) "relPermalink" .RelPermalink )}}
  {{- end -}}
  {{- $keyconceptsTerms := .GetTerms "keyconcepts" -}}
  {{- $keyconcepts := slice -}}
  {{- range $keyconceptsTerms -}}
    {{- $keyconcepts = $keyconcepts | append (dict "title" (.Title | humanize | title ) "relPermalink" .RelPermalink )}}
  {{- end -}}
  {{- $categoriesTerms := .GetTerms "categories" -}}
  {{- $categories := slice -}}
  {{- range $categoriesTerms -}}
    {{- $categories = $categories | append (dict "title" (.Title | humanize | title ) "relPermalink" .RelPermalink )}}
  {{- end -}}
  {{- $tagsTerms := .GetTerms "tags" -}}
  {{- $tags := slice -}}
  {{- range $tagsTerms -}}
    {{- $tags = $tags | append (dict "title" (.Title | humanize | title ) "relPermalink" .RelPermalink )}}
  {{- end -}}
  {{- $scratch.Add "index" (dict "image" $image "title" .Title "summary" .Summary "content" .Plain "gallery" $gallery "keyconcepts" $keyconcepts "categories" $categories "tags" $tags "permalink" .Permalink) -}}
{{- end -}}
// write json data to file
const searchIndex = {{ $scratch.Get "index" | jsonify }};

// ***********************
// search params function
//
function params(name) {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  return urlParams.get(name)
}

// ***********************
// check to see if a search has taken place
//
const searchQuery = params('q');
if (searchQuery) {
  // add the query to search input
  searchInput.value = searchQuery;
  searchResults.innerHTML = 'Loading...';
  // run the search
  search(searchIndex, searchQuery);
} else { // no search query
  searchResults.innerHTML = 'Please input your search into the search box.';
}


// ***********************
// run search
//
function search(data, pattern) {
    const options = {
      // isCaseSensitive: false,
      // includeScore: false,
      // shouldSort: true,
      // includeMatches: false,
      findAllMatches: true,
      minMatchCharLength: 2,
      // location: 0,
      threshold: 0.4,
      // distance: 100,
      // useExtendedSearch: false,
      ignoreLocation: true,
      // ignoreFieldNorm: false,
      // fieldNormWeight: 1,
      keys: [
        "title", // default weight 1
        { name: "content", weight: 0.6 },
       ]
    };
    const fuse = new Fuse(data, options);
    const results = fuse.search(pattern);
    showResults(results);
  }


// ***********************
// show results
//
  function showResults(results) {
    if (!results.length) { // no results
      searchResults.innerHTML = 'No results found';
    } else { // results found
      searchResults.innerHTML = ''; // clear DIV
      results.forEach(element => {
        const {title, image, summary, permalink, content, gallery, keyconcepts, categories, tags} = element.item;
        function taxonomyHTML(taxonomy, titleSingle, titlePlural) {
          let taxonomyHTML = '';
          if (taxonomy.length) { // terms present
            // create an array of term links
            const taxonomyArray = Array.from(taxonomy, value => {
              return `<a href="/site-preview/${value.relPermalink}">${value.title}</a>`;
            })
            // pluralise title
            let taxonomyTitle = titleSingle;
            if (titlePlural && (taxonomyArray.length >= 2)) {
              taxonomyTitle = titlePlural
            }
            // generate HTML
            taxonomyHTML = `
            <div class="pb-1">
              <small>${taxonomyTitle}: ${taxonomyArray.join(', ')}</small>
            </div>`;
          }
          return taxonomyHTML;
        }
        const output = `
      <div class="pb-3">
        <div class="row">
          <div class="col-sm-4 col-md-2">
            <img src="${image}" class="img-fluid">
          </div>
          <div class="col-sm-8 col-md-10">
          <h3 class="mb-1"><a href="${permalink}" class="text-decoration-none">${title}</a></h3>
          <div class="mb-1"><a href="${permalink}" class="link-dark">${permalink}</a></div>
          ${taxonomyHTML(categories,'Category', 'Categories')}
          ${taxonomyHTML(tags,'Tag', 'Tags')}
            <div class="lh-1">${summary}</div>
          </div>
        </div>
      </div>`;
      searchResults.innerHTML += output;
    });
  }
}
