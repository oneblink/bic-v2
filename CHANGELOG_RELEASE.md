# Weekly 2012.35

## Release Notes

Weekly 2012.35 includes all changes made in the time since Weekly
2012.13 which is the current Production version.

### Highlights

These are the larger changes to the system, and may effect compatibility
with current answerSpaces. Testing is highly recommended.

#### New Features
- **answerSpace images/assets can now be stored in a CDN**
- **CDNs for answerSpace assets can be shared between answerSpaces**
- **platform assets delivered via CDN for lower latency**
- **Categories can now be configured to display a description line**
- **additional HTML attributes to help target views with CSS**
- **Internet Explorer 8 now certified for advanced-mode**
- **update to jQuery UI 1.8.21 for improvements to widgets**
- **update to Modernizr 2.6.1 for device feature-detection**
- **Google Maps Directions now display on subsequent views**
- *updated to CodeMirror 2.32 for improved code editor in admin*
    - code editor is now on a separate dedicated page for convenience
- **select drop-downs in Forms can now be filled via Data Suitcase or Interaction**
- **new Step 4 MADL box in Forms for retrieving a specific form record**
- **Step 4 MADL code  in Forms now uses tab-settings over "default" if available**
- **new "draft" button, no automatic save to "pending" on "next page"**
- **file upload now works in older pre-HTML5 browsers like Safari / IE**
- **email/PDF notifications now use selected date/time formats**
- **direct "submit" from "pending" now checks field validation****

#### Platform
- $t->runInteraction() returns its result
- restricting to multiple user groups now behaves as expected
- user group names can be used (instead of ID) in custom login
- "landscape" and "portrait" overrides now used when rotating
- no more disruptive refresh after logging in to answerSpace
- setting to choose post-login destination for answerSpace
- adjust cookie behaviour in $t->fetch() for newer PHP/CURL versions
- new JavaScript events for convenience:
    - viewShow: (this) view has completed its animation
    - viewReady: (this) view has been enhanced with Stars, Maps, etc


#### Forms

- forms rendering is now faster and less prone to interruption on iOS
- odd and even row styles now effect "list" views and elsewhere
- no longer using WebShims for browser-compatibility
- email and text fields can now "form-fill" notifications
- sub-form field labels can now be controlled in the builder
- date/time fields now trigger calculations as other fields do
- improvements to Star Rating fields
- non-numeric record "id" fields no longer cause trouble
- new JavaScript events for convenience:
    - formReady: (this) form has been rendered, populated and is in DOM
    - formSubmitSuccess: a form record has been submitted
    - formSubmitError: a form record has failed submission


### Other Changes

#### Platform

- Interaction Manager now uploads images correctly from IE 8 and 9
- negative order values behave as expected
- basic-mode "back" link works with Master Categories
- fixed Interaction Manager ellipsis issues in WebKit
- answerSpaces with non-existent groups don't break
- not possible to delete groups that are in use
- activeFormsInteraction setting now imports/exports properly
- fixed answerSpace stall in iOS 6 caused by impatient scrollers


#### Forms

- field type picker in the builder has been reorganised
- Step 2 in the form builder has been reorganised
- required field in a conditional sub-form no longer blocks form
- leaving a form only triggers warning if fields have been changed
- Step 6 PDF fields are now the same as Email fields
- "edit", "view", "delete" links on the "list" view as appropriate
- no longer possible to name a new form the same as an old form
- pop-up title for select fields on iPad uses the field label
- improved conditional logic behaviour with select fields
- numeric 0 value stored as expected in form data
- read-only date/time fields behave as expected
- read-only select fields behave as expected
- form builder more reliable with certain sub-form settings
- slashes in form fields no longer behaving strangely
- "select other" fields now functioning as expected
- default value for checkbox fields now functioning

