sap.ui.controller("view.Logon",
{
	//DOKU VORLAGE nach JSdoc
	/** 
	 * Aufruf:
	 * Funktion:
	 *
	 * @param   {type} x - bla
	 * @returns {type} x - bla
	 */

	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 * @memberOf view.Shop
	 */
	//	onInit: function() {
	//
	//	},

	/**
	 * Aufruf: wenn der "Login"-Button gedrückt wird
	 * Funktion: es wird ein ajax request ausgeführt um sich verschlüsselt anzumelden, beim erfolg wird das Model gesetzt
	 */
	onPressLoginBtn: function()
	{
		//this.clearCookies(); --> muss man wieder einkommentieren, nur bei SAP Web IDE kommentiert 
		var userInput = (this.byId("idUserNameInput").getValue()).toUpperCase();
		var passwordInput = this.byId("idPasswordInput").getValue();

		if (this.inputChecker(userInput, passwordInput) === true)
		{
			var sUrl = "/sap/opu/odata/sap/ZCS_APP_SRV/";

			var sAuth = "Basic " + this.encodeCredentials(userInput, passwordInput);

			$.ajax(
			{
				url: sUrl + "?$format=json",
				type: "GET",
				dataType: "json",
				xhrFields:
				{
					withCredentials: true
				},
				beforeSend: function(request)
				{
					request.setRequestHeader("Authorization", sAuth);
				},
				success: function()
				{
					sap.ui.getCore().byId("idLogon").getController().setModel();
					console.log("Logon Success");
				},
				error: function()
				{
					sap.ui.getCore().byId("idLogon").getController().loginFailed();
					console.log("Logon Error");
				}
			});
		}
	},

	/**
	 * Aufruf: von onPressLoginBtn
	 * Funktion: Verschlüsselung des Usernamens und des Passworts
	 *
	 * @param   {string} userInput      - eingegebener Username
	 * @param   {string} passwordInput  - eingegebenes Passwort
	 * @return  {string} result         - Verschlüsselter String
	 */
	encodeCredentials: function(userInput, passwordInput)
	{
		var str = userInput + ":" + passwordInput;
		var result = window.btoa(str);
		console.log("Credentials encoded");

		return result;
	},

	/**
	 * Aufruf: von onPressLoginBtn
	 * Funktion: setzen des Service-Models (= MaraSet), bei Erfolg werden die restlichen Views geladen und der App hinzugefügt
	 */
	setModel: function()
	{
		var sUrl = "/sap/opu/odata/sap/ZCS_APP_SRV/";

		var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
		sap.ui.getCore().setModel(oModel, "Service");

		oModel.read("/MaraSet", null, null, true, //--> Testen ob man es weglassen kann 
			function(oData, oResponse) //Des Zeug nur laden wenn der Response erfolgreich war 
			{
				sap.m.MessageToast.show("Login successful!");
				
				var pageDebitor = sap.ui.view(
				{
					id: "idDebitor",
					viewName: "view.Debitor",
					type: sap.ui.core.mvc.ViewType.XML
				});
				var pageSearch = sap.ui.view(
				{
					id: "idSearch",
					viewName: "view.Search",
					type: sap.ui.core.mvc.ViewType.XML
				});
				var pageDetail = sap.ui.view(
				{
					id: "idDetail",
					viewName: "view.Detail",
					type: sap.ui.core.mvc.ViewType.XML
				});

				var pagePositionsInfo = sap.ui.view(
				{
					id: "idPositionsInfo",
					viewName: "view.PositionsInfo",
					type: sap.ui.core.mvc.ViewType.XML
				});
				var pageCart = sap.ui.view(
				{
					id: "idCart",
					viewName: "view.Cart",
					type: sap.ui.core.mvc.ViewType.XML
				});
				var pageWishlist = sap.ui.view(
				{
					id: "idWishlist",
					viewName: "view.Wishlist",
					type: sap.ui.core.mvc.ViewType.XML
				});

				var oApp = sap.ui.getCore().byId("App");
				oApp.addPage(pageDebitor);
				oApp.addPage(pageSearch);
				oApp.addPage(pageDetail);
				oApp.addPage(pagePositionsInfo);
				oApp.addPage(pageCart);
				oApp.addPage(pageWishlist);

				oApp.to("idSearch");
			},
			function(oError)
			{
				sap.ui.getCore().byId("idLogon").getController().loginFailed();
				console.log(oError);
			});
	},

	/**
	 * Aufruf: von onPressLoginBtn und setModel
	 * Funktion: zeigt eine Nachricht und setzt die Eingaben zurück
	 */
	loginFailed: function()
	{
		console.log("Login fehlgeschlagen!");
		sap.m.MessageToast.show("Login invalid!");

		//Clear Credentials --> Methode hat nicht funktioniert 
		this.getView().byId("idUserNameInput").setValue("");
		this.getView().byId("idPasswordInput").setValue("");
	},

	/**
	 * Aufruf: von onPressLoginBtn
	 * Funktion: Benutzereingaben überprüfen, wenn sie nicht passen werden die Eingabefelder geelert
	 *
	 * @param   {string} user      - eingegebener Username
	 * @param   {string} password  - eingegebenes Passwort
	 * @return  {boolean}          - boolean Wert ob die Eingabe den Mindestanforderungen entspricht
	 */
	inputChecker: function(user, password) //Passwort muss größer 6 Zeichen sein 
	{
		if (user.length !== 4 || password.length < 1)
		{
			sap.m.MessageToast.show("Input invalid!");

			//	Clear Credentials
			this.getView().byId("idUserNameInput").setValue("");
			this.getView().byId("idPasswordInput").setValue("");
			return false;
		}
		else
		{
			return true;
		}
	},

	/**
	 * Aufruf: wenn der Logout Button gedrückt wird
	 * Funktion: entfernen aller Pages und löschen der Session Cookies
	 */
	logout: function()
	{
		sap.ui.getCore().byId("App").to("idLogon");
		this.clearCookies();

		//Clear Credentials 
		this.getView().byId("idUserNameInput").setValue("");
		this.getView().byId("idPasswordInput").setValue("");

		//Pages entfernen von der App u. zerstören, damit man sie wieder aufbauen kann 
		var oApp = sap.ui.getCore().byId("App");

		//var pageLogon = sap.ui.getCore().byId("idLogon"); 
		var pageSearch = sap.ui.getCore().byId("idSearch");
		var pageDetail = sap.ui.getCore().byId("idDetail");
		var pagePositionsInfo = sap.ui.getCore().byId("idPositionsInfo");
		var pageCart = sap.ui.getCore().byId("idCart");

		oApp.removePage(pageSearch);
		oApp.removePage(pageDetail);
		oApp.removePage(pagePositionsInfo);
		oApp.removePage(pageCart);

		pageSearch.destroy();
		pageDetail.destroy();
		pagePositionsInfo.destroy();
		pageCart.destroy();

		sap.m.MessageToast.show("Logout successful!");

		location.reload();
	},

	/*setCookie: function(cookie, value, days)
	{
		if (days)
		{
			var date = new Date();
			date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
			var expires = "; expires=" + date.toGMTString();
		}
		else
			expires = "";
		document.cookie = cookie + "=" + value + expires + "; path=/";
	},

	readCookie: function(cookie)
	{
		var cookieEq = cookie + "=";
		var ca = document.cookie.split(';');
		for (var i = 0; i < ca.length; i++)
		{
			var c = ca[i];
			while (c.charAt(0) == ' ')
			{
				c = c.substring(1, c.length);
			}
			if (c.indexOf(cookieEq) == 0)
			{
				return c.substring(cookieEq.length, c.length);
			}
		}
		return null
	},
*/
	/**
	 * Aufruf: von logout
	 * Funktion: löschen ALLER vorhanden Cookies
	 */
	clearCookies: function()
	{
		if (document.cookie)
		{
			var cookie = document.cookie;

			//Löschen aller Cookies --> Problem liegt darin dass des Passwort schon verlangt wird wenn man auf den Server will --> Entscheidung: Fiori App oder Tablet App 
			//bei Fiori App braucht man Login nicht --> nur Logout 
			//bei Tablet App könnte man des Problem evtl dadurch lösen wenn man die Login Seite im SAP System einstellt 
			var arr = cookie.split(";"); //1. Wert: cookieName1=cookieWert2; 2. Wert: cookieName2=cookieWert2 ....

			for (var i = 0; i < arr.length; i++)
			{
				console.log(arr[i]);
				document.cookie = arr[i] + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
			}
			//document.cookie = cookieName + ""‘meincookie=meinwert; expires=Thu, 01-Jan-70 00:00:01 GMT;';
		}
		console.log("Cookies cleared");

		//this.setCookie("SAP_SESSIONID_D01_001", "", -1)

		//löscht nicht?!?!?
		/*	document.execCommand('ClearAuthenticationCache');

		var sName1 = "sap-usercontext";
		var sName2 = "SAP_SESSIONID_D01_001";
		var sName3 = "JSESSIONID_preview_0"; //für localhost 
		var sName4 = "JSESSIONID"; //für localhost 
		var sName5 = "MYSAPSSO2";
		
		var sso2Domain = location.hostname;
		if (location.hostname.indexOf(".") > 0)
		{
			sso2Domain = location.hostname.substr(location.hostname.indexOf(".") + 1);
		}

		document.cookie = sName1 + "=; expires=Fri, 31 Dec 1999 23:59:59 GMT; path=/";
		document.cookie = sName2 + "=; expires=Fri, 31 Dec 1999 23:59:59 GMT; path=/";
		document.cookie = sName3 + "=0; expires=Fri, 31 Dec 1999 23:59:59 GMT;domain=" + sso2Domain + ";";
		document.cookie = sName4 + "=0; expires=Fri, 31 Dec 1999 23:59:59 GMT;domain=" + sso2Domain + ";";
		document.cookie = sName5 + "=; expires=Fri, 31 Dec 1999 23:59:59 GMT; path=/";*/
	}
	//str --> cookie
	/*findAllCookieNamesValues : function(str) //Vermutung: ‚geht nur wenn man mehr als einen Cookie hat 
	{
	    var chr = "="; 
	    var firstPoint = str.search(chr); 
	    
	    
	    if(firstPoint !== -1) //nicht vorhanden bei -1
	    {
	        
	    }
	},
*/
	/**
	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
	 * (NOT before the first rendering! onInit() is used for that one!).
	 * @memberOf view.Shop
	 */
	//	onBeforeRendering: function() {
	//
	//	},

	/**
	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
	 * This hook is the same one that SAPUI5 controls get after being rendered.
	 * @memberOf view.Shop
	 */
	//onAfterRendering: function()
	//{
	//später ist dass der Punkt wo zwischen Fiori App (keine Anmeldung nötig) und Cordova App unterschieden wird 
	/*jQuery.sap.require("sap.m.MessageBox");
		sap.m.MessageBox.show("No Fiori App?",
		{
			icon: sap.m.MessageBox.Icon.INFORMATION,
			title: "Information",
			actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
			onClose: function(oAction)
			{
				if (oAction === sap.m.MessageBox.Action.NO)
				{
					sap.ui.getCore().byId("App").to("idSearch");

					//hier ist beim Model setzten kein Username und Passwort dabei 
					var sUrl = "/sap/opu/odata/sap/ZCS_APP_SRV/";
					var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
					sap.ui.getCore().setModel(oModel, "Service");
				}

			}
		});*/
	//	}

	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * @memberOf view.Shop
	 */
	//	onExit: function() {
	//
	//	}

});