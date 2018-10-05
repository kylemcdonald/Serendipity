# Serendipity (2014)

[https://vimeo.com/293645693](https://vimeo.com/293645693)

This project was supported by Spotify during the first artist in residence program in 2014. 

Because the Spotify v1 API no longer allows lookups to the `track/` endpoint without an access token, to run this you must:

1. Sign up for a [Spotify developer account](https://developer.spotify.com/)
2. Create an app.
3. Add a redirect URL (any URL will work) to your app settings.
3. Get an [access token](https://developer.spotify.com/documentation/general/guides/authorization-guide/#implicit-grant-flow) (Temporary/Implicit Grant Flow) for your account. You can do this with the browser without setting up any backend and just checking the HTTP GET arguments. 
4. Add the access token to the top of `serendipity.js`.
5. Start an HTTP server. No other backend is required.

The original version worked with Spotify's internal Storm infrastructure for parallel processing of realtime user data, but this version was only accessible inside the Spotify offices. The git history has been wiped to avoid leaking any internal information about Spotify.