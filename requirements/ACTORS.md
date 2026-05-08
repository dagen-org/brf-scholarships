## Actors and Use Cases

The system will support 3 types of users:
- Administrators
- Applicants
- Reviewer


### Administrators
An Administrator can control every element of the system.  

#### Use Cases
- Invite reviewers to create an account, or create a reviewer account directly.
- Edit, or change passwords for any reviewer.
- Create Application Windows.
- Review applications.




### Applicant
Applicants are young adults who attended high school in the Beaverton School District, or reside in city of Beaverton, OR.  Applicants will have the following workflows:

#### Use Cases
Applicants can:

- Create an account within the system; identified by email address and password. 
- Log into the system.
- Update or change their password.
- Create a application based on one of the 4 scholarship types.
- Submit data to application. This data will consist of traditional form fields (text values, dates, numeric values, etc.).
- Attach files to their application.  Applicants may upload PDF, DOCX, or TXT files to be reviewed as part of their application.
- Resume editing their application at any time before the submission deadline.

#### Constraints

- Applicants may have only one active application at any time.  Active applications are defined from the moment of creation until the scholarship deadline, defined as the 3rd Monday in April of each calendar year.


### Reviewes
Reviewers are members of Beaverton Rotary and will be invited to create an account of type 'reviewer' by the site administrator.

#### Use Cases
- Accept inviation to create an account as a 'reviewer'
- Log into the system
- Update or change their password
- Review scholarship applications
- Attach comments, questions, or notes to each application
- View, or respond to any comment, question, or notes concerning an application