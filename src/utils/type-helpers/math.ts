function formatTimestamp(ms: number) {
  let seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);

  ms -= seconds * 1000;
  seconds -= minutes * 60;

  return (minutes > 0 ? `${('0' + minutes).slice(-2)}:` : '') + ('0' + seconds).slice(-2) + '.' + ('000' + ms).slice(-3);
}

export {
  formatTimestamp,
};
