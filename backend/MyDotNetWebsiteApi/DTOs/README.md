## DTOs

DTO stands for Data Transfer Object
Simple classes that represent data that is being transferred.


# Note on Annotations:
To use, put this in the top of the DTO file: 
using System.ComponentModel.DataAnnotations;

Example Annotated Variable:
[Required]
[MaxLength(200)]
public string Name {get; set;} = string.Empty;

DTOs used for sending commands to change information (For example: CreateMediaLsitDto) have annotations to restrict the front-end/user to only send approved types in the variable values for security's sake. So once the DTO reaches the code, the DTO's variable's values are already the right variable types.

DTOs that are for reading (For example; UserSummaryDTO) don't need annotations since it is sending information back to the front end (and thus it never is processed by the backend, which would have the vulernable data)