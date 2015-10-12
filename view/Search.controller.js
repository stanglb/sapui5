sap.ui.controller("view.Search",
{
	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 *
	 * @memberOf view.Cart
	 */
	onInit: function()
	{
		this.loadData();
	},

	/** 
	 * Aufruf: von onInit und immer dann wenn das maModel aktualisiert werden muss
	 * Funktion: initialisieren des maModels und binden der Liste des Views an das maModel
	 */
	loadData: function()
	{
		var actualMatnr, actualMaktx, actualPrice;
		var oList = this.getView().byId("idList");
		var maModel = [];
		var oController = this;

		//evtl braucht man das MARA Model gar nicht 
		var oPriceModel = new sap.ui.model.json.JSONModel().attachRequestCompleted(
			function(oData0)
			{
				//Daten des Price Entity Sets 
				var oPreise = oData0.getSource().getProperty("/d/results");
				//console.log("oPreise.length = " + oPreise.length);

				var oMAKTModel = new sap.ui.model.json.JSONModel().attachRequestCompleted(
					function(oData1)
					{
						//Daten des MAKT Entity Sets 
						var oTexte = oData1.getSource().getProperty("/d/results");
						//console.log("oTexte.length = " + oTexte.length);

						var oWishlistModel = new sap.ui.model.json.JSONModel().attachRequestCompleted(
							function(oData2)
							{
								//Daten des MARA Entity Sets 
								var oWishlist = oData2.getSource().getProperty("/d/results");
								//console.log("oProducts.length = " + oProducts.length);

								//Speichern der Daten in eiem actual Model danach wird es in das maModel gespeichert 
								for (var x = 0; x < oTexte.length; x++)
								{
									actualMaktx = oTexte[x].Maktx;
									actualMatnr = oTexte[x].Matnr;
									actualPrice = parseFloat(oPreise[x].Zprice).toFixed(2); //hier wird zum ersten mal ein Preis geholt --> und gleich schön formatiert 

									var actualModel;
									var markFavorite = false;

									var positionInWishtlist = oController.checkInWishlist(oWishlist, actualMatnr);
									if (positionInWishtlist > -1) //Wenn es in der Wunschliste ist 
									{
										markFavorite = true;
										actualModel = {
											"matnr": actualMatnr,
											"maktx": actualMaktx,
											"preis": actualPrice,
											"positionInWishlist": positionInWishtlist,
											"wishlistDate": oWishlist[positionInWishtlist].Datum,
											"inWishlist": markFavorite
										};
									}
									else //Wenn es nicht in der Wunschliste ist 
									{
										actualModel = {
											"matnr": actualMatnr,
											"maktx": actualMaktx,
											"preis": actualPrice,
											"positionInWishlist": null,
											"wishlistDate": null,
											"inWishlist": markFavorite
										};
									}

									maModel[x] = actualModel;

									oList.bindItems(
									{
										path: "maModel>/materials", //wird an maModel gebunden --> braucht man für die Suche 
										template: new sap.m.ObjectListItem(
										{
											title: "{maModel>maktx}",
											intro: "{maModel>matnr}",
											icon: "sap-icon://course-book",
											type: "Active",
											number: "{maModel>preis}",
											numberUnit: "€",
											showMarkers: true,
											markFavorite: "{maModel>inWishlist}",
											press: function(evt)
											{
												var actualMat = evt.getSource().getIntro();
												var actualMatx = evt.getSource().getTitle();
												var actualZPrice = evt.getSource().getNumber();

												//aktuelle Matrialnummer und Bezeichnung wird gespeichert --> solange bis auf ein neues Feld der Suche geklickt wird 
												sap.ui.getCore().byId("idDetail").data("actualMatnr", actualMat);
												sap.ui.getCore().byId("idDetail").data("actualMaktx", actualMatx);
												sap.ui.getCore().byId("idDetail").data("actualPrice", actualZPrice);

												//aktuelle Daten beim nächsten View eintragen 
												sap.ui.getCore().byId("idDetail").getController().getActualData();
												sap.ui.getCore().byId("idWishlist").getController().loadData();

												sap.ui.getCore().byId("App").to("idDetail");

												//	this.getView().byId("idSearch").byId("idSearchField").setValue("");// --> setzt den Filter nicht zurück 
											}
										})
									});
								}
							});
						oWishlistModel.loadData("/sap/opu/odata/sap/ZCS_APP_SRV/WishlistSet?$format=json");

					});
				oMAKTModel.loadData("/sap/opu/odata/sap/ZCS_APP_SRV/MAKTSet?$format=json");

			});
		oPriceModel.loadData("/sap/opu/odata/sap/ZCS_APP_SRV/PriceSet?$format=json");

		//setzen des maModels 
		var jsonModel = {
			"materials": maModel
		};
		var oModel = new sap.ui.model.json.JSONModel(jsonModel);
		sap.ui.getCore().setModel(oModel, "maModel");
	},
	/**
	 * Aufruf: beim drücken des Add to Wishlist Buttons
	 * Funktion: Navigation zur Wishlist
	 */
	onPressWishlistBtn: function()
	{
		sap.ui.getCore().byId("idWishlist").getController().loadData();
		sap.ui.getCore().byId("App").to("idWishlist");
	},

	/** 
	 * Aufruf: von loadData
	 * Funktion: zu einer Materialnummer und dem Wishlist Array die Position im Array herausfinden
	 *
	 * @param   {Array}     oWishlist - Wishlist Array
	 * @param   {string}    matnr - Materialnummer
	 * @returns {Number}       result - ist die Position der Matnr im Array
	 */
	checkInWishlist: function(oWishlist, matnr)
	{
		var result = -1; //wenn die Matnr nicht im Array ist dann wird -1 zurückgegeben 

		for (var i = 0; i < oWishlist.length; i++)
		{
			//Wenn an einer Stelle die Matnr gleich der übergebenen matnr ist, wird die Position zurückgegeben 
			if (oWishlist[i].Matnr === matnr)
			{
				result = i;
			}
		}

		return result;
	},

	/**
	 * Aufruf: beim drücken des Logout Buttons
	 * Funktion: Aufruf von logout()
	 */
	onPressLogBtn: function()
	{
		sap.ui.getCore().byId("idLogon").getController().logout();
	},

	/**
	 * Aufruf: beim drücken des "Show Cart"-Buttons
	 * Funktion: Navigation zum Einkaufswagen
	 */
	onPressCartBtn: function()
	{
		sap.ui.getCore().byId("App").to("idCart");
	},

	/**
	 * Aufruf: von der Suche
	 * Funktion: filtern der Liste
	 *
	 * @param   {oControlEvent}   oEvt
	 */
	onSearch: function(oEvt)
	{
		// add filter for search
		var filters = [];
		var entry = oEvt.getSource().getValue();
		var oFilter;

		//wenn etwas einegegben wird werden neue Filter gesetzt und danach gesucht ob es den eintrag gibt --> in der Matnr oder der Maktx, bezogen auf das gesetzte Model 
		if (entry && entry.length > 0)
		{
			var filterMatnr = new sap.ui.model.Filter("matnr", sap.ui.model.FilterOperator.Contains, entry);
			var filterMaktx = new sap.ui.model.Filter("maktx", sap.ui.model.FilterOperator.Contains, entry);
			filters.push(filterMatnr);
			filters.push(filterMaktx);

			oFilter = new sap.ui.model.Filter(filters, false); //mit false wird die oder Funktion ausgewählt 
		}

		// update list binding --> um das Ergbenis der Suche darzustellen 
		var binding = this.getView().byId("idList").getBinding("items");
		binding.filter(oFilter, "Application");
	}

	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 * @memberOf view.Search
	 */
	//	onInit: function() {
	//
	//	},

	/**
	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
	 * (NOT before the first rendering! onInit() is used for that one!).
	 * @memberOf view.Search
	 */
	//	onBeforeRendering: function() {
	//
	//	},

	/**
	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
	 * This hook is the same one that SAPUI5 controls get after being rendered.
	 * @memberOf view.Search
	 */
	//	onAfterRendering: function() {
	//
	//	},

	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * @memberOf view.Search
	 */
	//	onExit: function() {
	//
	//	}

});