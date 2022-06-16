function until(conditionFunction) {
  const poll = (resolve) => {
    if (conditionFunction()) resolve();
    else setTimeout(() => poll(resolve), 1000);
  };

  return new Promise(poll);
}

module.exports = until;
