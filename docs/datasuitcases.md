# BIC v2

## Data Suitcases

### Public Data Suitcases

These are managed with the `$t->setJourneyObject(name, contents)` and `$t->getJourneyObject(name)`
MADL commands in the server-side configuration.

Clients retrieve the contents by Data Suitcase name only, with no authentication required.
Thus, they should only be used for data that is not confidential.

All users of an answerSpace receive the same contents, it is not possible to tailor the contents per-user.
The initial use case was for conference agendas and timetables.

As these were initially designed to be used with XSLT, it is required that an XSLT interaction refer to
such a Data Suitcase in order to declare that the Data Suitcase needs to be downloaded. In the event that
your use case does not involve XSLT, you may hide the referring Interaction from users.

### JavaScript API

#### processMoJOs ()

- @returns {jQueryPromise}

This global function triggers the process of retrieving all public Data Suitcases for an answerSpace.
Any content that has been previously downloaded may be replaced / updated during this process.

As noted above, only public Data Suitcases that are referenced by XSLT interactions are included.
