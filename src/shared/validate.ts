/**
 * validate.ts — per-record validation for AlbumData documents. Lives
 * beside the schema type it validates. Cross-file checks (id↔filename,
 * duplicate ids) belong to scripts/albums/album-index.ts, which sees the
 * whole data/ directory.
 */

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function addRequiredStringIssue(record: JsonObject, field: string, path: string, issues: string[]): void {
  if (typeof record[field] !== 'string' || !record[field].trim()) {
    issues.push(`${path} is required`);
  }
}

function addOptionalStringIssue(record: JsonObject, field: string, path: string, issues: string[]): void {
  if (record[field] !== undefined && typeof record[field] !== 'string') {
    issues.push(`${path} must be a string`);
  }
}

function addPresenceFlagIssue(record: JsonObject, field: string, path: string, issues: string[]): void {
  if (record[field] !== undefined && record[field] !== true) {
    issues.push(`${path} must be true when provided`);
  }
}

function addFiniteNumberIssue(record: JsonObject, field: string, path: string, issues: string[]): void {
  if (typeof record[field] !== 'number' || !Number.isFinite(record[field])) {
    issues.push(`${path} must be a number`);
  }
}

function getTimelineEventIssues(value: unknown, path: string): string[] {
  if (!isJsonObject(value)) {
    return [`${path} must be an object matching TimelineEvent`];
  }

  const issues: string[] = [];
  addRequiredStringIssue(value, 'timestamp', `${path}.timestamp`, issues);
  addRequiredStringIssue(value, 'section', `${path}.section`, issues);
  addRequiredStringIssue(value, 'description', `${path}.description`, issues);

  if (value.detail !== undefined && typeof value.detail !== 'string') {
    issues.push(`${path}.detail must be a string`);
  }

  return issues;
}

function getAlbumTrackIssues(value: unknown, path: string): string[] {
  if (!isJsonObject(value)) {
    return [`${path} must be an object matching AlbumTrack`];
  }

  const issues: string[] = [];
  addFiniteNumberIssue(value, 'num', `${path}.num`, issues);
  addRequiredStringIssue(value, 'title', `${path}.title`, issues);
  addRequiredStringIssue(value, 'duration', `${path}.duration`, issues);

  if (value.energy !== 'low' && value.energy !== 'mid' && value.energy !== 'high' && value.energy !== 'peak') {
    issues.push(`${path}.energy must be a valid energy level`);
  }

  if (!Array.isArray(value.tags)) {
    issues.push(`${path}.tags must be an array`);
  } else if (!value.tags.every(tag => typeof tag === 'string' && !!tag.trim())) {
    issues.push(`${path}.tags entries must be non-empty strings`);
  }

  addRequiredStringIssue(value, 'role', `${path}.role`, issues);

  if (!Array.isArray(value.events)) {
    issues.push(`${path}.events must be an array`);
  } else {
    value.events.forEach((event, index) => {
      issues.push(...getTimelineEventIssues(event, `${path}.events[${index}]`));
    });
  }

  return issues;
}

/** Issues with a single parsed data/<id>.json document; [] when valid. */
export function getAlbumDataIssues(value: unknown): string[] {
  if (!isJsonObject(value)) {
    return ['must be a JSON object matching AlbumData'];
  }

  const issues: string[] = [];

  addRequiredStringIssue(value, 'id', 'id', issues);
  addRequiredStringIssue(value, 'artist', 'artist', issues);
  addRequiredStringIssue(value, 'title', 'title', issues);
  addFiniteNumberIssue(value, 'year', 'year', issues);
  addRequiredStringIssue(value, 'label', 'label', issues);
  addRequiredStringIssue(value, 'producer', 'producer', issues);
  addOptionalStringIssue(value, 'coverUrl', 'coverUrl', issues);
  addOptionalStringIssue(value, 'spotifyUrl', 'spotifyUrl', issues);
  addOptionalStringIssue(value, 'youtubeUrl', 'youtubeUrl', issues);
  addOptionalStringIssue(value, 'audioStreamUrl', 'audioStreamUrl', issues);
  addPresenceFlagIssue(value, 'isSoundtrack', 'isSoundtrack', issues);
  if (typeof value.genre !== 'string') {
    issues.push('genre must be a string');
  }

  if (!Array.isArray(value.genreTags)) {
    issues.push('genreTags must be a non-empty array of genre/subgenre tags');
  } else {
    const hasOnlyNonEmptyStrings = value.genreTags.every(tag => typeof tag === 'string' && !!tag.trim());
    if (!hasOnlyNonEmptyStrings) {
      issues.push('genreTags entries must be non-empty strings');
    }
    if (value.genreTags.length < 1) {
      issues.push('genreTags must be a non-empty array of genre/subgenre tags');
    }
    if (value.genreTags.length > 9) {
      issues.push('genreTags must contain no more than 9 tags');
    }
  }

  addRequiredStringIssue(value, 'runtime', 'runtime', issues);
  addRequiredStringIssue(value, 'overview', 'overview', issues);
  if (!Array.isArray(value.tracks)) {
    issues.push('tracks must be an array');
  } else {
    value.tracks.forEach((track, index) => {
      issues.push(...getAlbumTrackIssues(track, `tracks[${index}]`));
    });
  }

  return issues;
}
