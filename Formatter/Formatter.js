//Momentan nicht in Verwendung 

jQuery.sap.declare("Formatter.Formatter");

Formatter.Formatter = 
{
  status :  function (sStatus) 
  {
      if (sStatus === "Available") 
      {
        return "Success";
      } 
      else if (sStatus === "Out of Stock") 
      {
        return "Warning";
      } 
      else if (sStatus === "Discontinued")
      {
        return "Error";
      } 
      else 
      {
        return "None";
      }
  }
};