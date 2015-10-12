sap.ui.controller("view.Detail",
{
	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 * @memberOf view.ShopDetail
	 */
	//	onInit: function() {
	//
	//	},

	/**
	 * Aufruf: beim drücken des Add to Wishlist Buttons
	 * Funktion: Navigation zur Wishlist und neuladen der Daten in der Wishlist
	 */
	onPressWishlistBtn: function()
	{
		sap.ui.getCore().byId("idWishlist").getController().loadData();
		sap.ui.getCore().byId("App").to("idWishlist");
	},

	/** 
	 * Aufruf: beim drücken auf den "Add to Wishlist"-Button
	 * Funktion: senden des Create-Requests für einen neuen Eintrag
	 */
	onPressAddToWishlistBtn: function()
	{
		//Ich brauche kunnr = "13", matnr = actualMat, datum = heute, gekauft = ""
		var actualMat = sap.ui.getCore().byId("idDetail").data("actualMatnr");
		var oModel = sap.ui.getCore().getModel("Service");
		var oView = this.getView();
		var oController = this;

		var requestBody = {
			Kunnr: "13",
			Matnr: actualMat,
			Datum: new Date(),
			Gekauft: ""
		};

		oModel.create("/WishlistSet", requestBody, null,
			function(oSuccess)
			{
				oView.byId("idGrid1").removeAllContent();
				oView.byId("idGrid2").removeAllContent();
				sap.ui.getCore().byId("idSearch").getController().loadData(); //maModel wird neu geladen --> ruft die getActualData() auf 

				var dialog = new sap.m.Dialog(
				{
					title: "Info",
					type: "Message",
					state: "Success",
					content: new sap.m.Text(
					{
						text: " Product " + oSuccess.Matnr + " successfully added to Wishlist!"
					}),
					beginButton: new sap.m.Button(
					{
						text: "OK",
						press: function()
						{
							dialog.close();
							oController.getActualData();
						}
					})
				});

				dialog.open();
			},
			function(oError)
			{
				var oErrorJSON = JSON.parse(oError.response.body);
				var sError = oErrorJSON.error.message.value;

				sap.m.MessageToast.show(sError);
			});
	},

	/**
	 * Aufruf: beim drücken des Zurück Buttons
	 * Funktion: Navigation zur Suche
	 */
	handleNavBack: function()
	{
		sap.ui.getCore().byId("App").to("idSearch");
	},

	/**
	 * Aufruf: beim drücken des "Add to Cart"-Buttons
	 * Funktion: laden der aktuellen Daten auf dem PositionsInfo-View und Navigation zur PositionsInfo
	 */
	onPressAddBtn: function()
	{
		sap.ui.getCore().byId("idPositionsInfo").getController().getActualData();
		sap.ui.getCore().byId("App").to("idPositionsInfo");
	},

	/**
	 * Aufruf: beim drücken des Logout Buttons
	 * Funktion: Aufruf von logout()
	 */
	onPressLogBtn: function()
	{
		sap.ui.getCore().byId("idLogon").getController().logout();
	},

	/*
	 * Aufruf: wenn man auf einen Cross Selling Vorschlag drückt
	 * Funktion: Neuladen der Seite und setzen der aktuellen Werte
	 *
	 * @param   {oControlEvent}   evt
	 */
	onObjectItemPress: function(evt)
	{
		//this.getView().
		sap.ui.getCore().byId("App").to("idDetail");

		//Aktuelle Materialnummer holen 
		var actualMat = evt.getSource().getIntro();
		sap.ui.getCore().byId("idDetail").data("actualMatnr", actualMat);

		var x = this.getMatPosition(actualMat); //position im Array 
		var maModelData = sap.ui.getCore().getModel("maModel").getData().materials[x]; //Daten aus dem maModel für das aktuelle Material  

		sap.ui.getCore().byId("idDetail").data("actualMaktx", maModelData.maktx);
		sap.ui.getCore().byId("idDetail").data("actualPrice", maModelData.preis);

		this.getActualData();
	},

	/**
	 * Aufruf: vom Search.controller nach dem drücken auf ein ListItem und beim drücken auf ein ObjectItem
	 * Funktion: Laden der aktuellen Daten auf dem Detail-View
	 */
	getActualData: function()
	{
		var oView = this.getView();

		oView.byId("idGrid1").removeAllContent();
		oView.byId("idGrid2").removeAllContent();

		var actualMat = sap.ui.getCore().byId("idDetail").data("actualMatnr");
		var actualMaktx = sap.ui.getCore().byId("idDetail").data("actualMaktx");
		var actualPrice = sap.ui.getCore().byId("idDetail").data("actualPrice");

		console.log("Detail: actualMat = " + actualMat + " // actualMaktx = " + actualMaktx + " // actualPrice = " + actualPrice);

		if (actualMat != null)
		{
			var positionInMaModel = this.getMatPosition(actualMat);
			var maModelData = sap.ui.getCore().getModel("maModel").getData().materials;
			var inWishlist = maModelData[positionInMaModel].inWishlist;

			oView.byId("idObjectHeader").bindElement("Service>/MaraSet('" + actualMat + "')");
			oView.byId("idObjectHeader").setTitle(actualMaktx);
			oView.byId("idObjectHeader").setNumber(actualPrice);
			oView.byId("idObjectHeader").setMarkFavorite(inWishlist);
			oView.byId("idDescription").bindElement("Service>/VtexSet('" + actualMat + "')");

			this.loadCrossSelling();

			//Unterscheidung ob der "AddToWishlist"-Btn angezeigt wird 
			if (inWishlist === true)
			{
				//Wenn das Produkt schon auf der Wishlist ist, will man es nicht nochmal hinzufügen können 
				oView.byId("idAddToWishlistBtn").setVisible(false);
			}
			else
			{
				oView.byId("idAddToWishlistBtn").setVisible(true);
			}
		}
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
	 * Aufruf: von getActualData
	 * Funktion: Laden den CrossSelling Artikel und anzeigen im Detail.view
	 */
	loadCrossSelling: function()
	{
		var oController = this;
		oController.getView().byId("idCarousel").addPage(oController.getView().byId("idGrid2"));
		
		var oModel = new sap.ui.model.json.JSONModel().attachRequestCompleted(
			function(oData)
			{
				//Daten des Price Entity Sets 
				var oResult = oData.getSource().getProperty("/d/results");
				var howMany = oResult.length;

				//Um das zweite Grid visible oder invisible zu schalten 
				var visibleGrid2 = false;

				//Anhand der Größe des Arrays erhält man die Anzahl der Cross Selling Produkte 
				//Es sollen aber nur die ersten vier in das erste Grid geladen werden, die nächsten in das zweite  
				// Wenn die Länge größer 4 ist und größer oder gleich acht, dann soll das zweite Grid geladen werden 
				if (howMany > 8 || howMany === 8)
				{
					howMany = 8;
					for (var i = howMany; i > 4; i--)
					{
						oController.setCrossSelling("idGrid2", howMany, oResult, i - 1); //-1 weil es ja bei 0 anfängt 
					}
					visibleGrid2 = true;
				}
				else if (howMany < 8 && howMany > 4)
				{
					for (var j = howMany; j > 4; j--)
					{
						oController.setCrossSelling("idGrid2", howMany, oResult, j - 1);
					}
					visibleGrid2 = true;
				}
				//Wenn die Länge größer vier ist sollen nur die ersten vier angezeigt werden sonst die Länge des Arrays 
				if (howMany > 4)
				{
					howMany = 4;
				}
				//Grid1 soll immer geladen werden 
				for (var k = 0; k < howMany; k++)
				{
					oController.setCrossSelling("idGrid1", howMany, oResult, k);
				}
				
				//!!!!!!!!!!!!!geht noch nicht!!!!!!!!!--> muss man evtl dann auch wieder hinzufügen 
				if (visibleGrid2 === false)
				{
					oController.getView().byId("idCarousel").removePage(oController.getView().byId("idGrid2"));
				}
			});

		var actualMat = sap.ui.getCore().byId("idDetail").data("actualMatnr");
		//Cross Selling Produkte zur aktuellen Materialnummer bekommen 
		oModel.loadData("/sap/opu/odata/sap/ZCS_APP_SRV/CrossSellingSet?$filter=Matnr eq '" + actualMat + "'");
	},

	setCrossSelling: function(idGrid, howMany, oResult, position)
	{
		console.log("setCrossSelling called --> howMany = " + howMany);
		var oController = this;

		var csMat = parseInt(oResult[position].MatnrCS);
		var x = oController.getMatPosition(csMat);

		var oObjectListItem = new sap.m.ObjectListItem(
		{
			intro: "{maModel>matnr}",
			title: "{maModel>maktx}",
			icon: "sap-icon://course-book",
			type: "Active",
			number: "{maModel>preis}",
			numberUnit: "€",
			showMarkers: true,
			markFavorite: "{maModel>inWishlist}",
			press: function(evt)
			{
				oController.onObjectItemPress(evt);
			}
		});
		oObjectListItem.bindElement("maModel>/materials/" + x);

		oController.getView().byId(idGrid).addContent(oObjectListItem);
	},

	/** 
	 * Aufruf: von loadCrossSelling und getActualData
	 * Funktion: zu einer übergegbenen Materialnummer wird die Position im maModel gesucht
	 *
	 * @param   {int} matnr - Materialnummer zu der man die Position im maModel haben möchte
	 * @returns {int} result - Position im Array
	 */
	getMatPosition: function(matnr)
	{
		var maModelData = sap.ui.getCore().getModel("maModel").getData().materials; //ist ein Array
		var result;

		for (var i = 0; i < maModelData.length; i++)
		{
			if (maModelData[i].matnr == matnr) //ich darf hier nicht auf "===" prüfen, da dass eine ein String ist und das andere ein int 
			{
				result = i; //Position im Array --> brauche ich um die Cross Selling Produkte ans maModel zu binden 
			}
		}
		return result;
	}
	/**
	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
	 * This hook is the same one that SAPUI5 controls get after being rendered.
	 * @memberOf view.ShopDetail
	 */
	// 	onAfterRendering: function()
	// 	{

	// 	}

	/**
	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
	 * (NOT before the first rendering! onInit() is used for that one!).
	 * @memberOf view.ShopDetail
	 */
	//	onBeforeRendering: function() {
	//
	//	},

	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * @memberOf view.ShopDetail
	 */
	//	onExit: function() {
	//
	//	}

});