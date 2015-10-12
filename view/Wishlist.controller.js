sap.ui.controller("view.Wishlist",
{
	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 * @memberOf view.Wishlist
	 */
	onInit: function()
	{
		var oView = this.getView();

		if (sap.ui.Device.support.touch === true)
		{
			oView.byId("idDelIcon").setVisible(false);
			oView.byId("idToolbarWishlist").setVisible(false);
		}
	},

	/**
	 * Aufruf: beim drücken des Zurück Buttons
	 * Funktion: Navigation zur Suche und verschwinden des Confirm Buttons
	 */
	handleNavBack: function()
	{
		sap.ui.getCore().byId("idDetail").getController().getActualData();

		var actualMat = sap.ui.getCore().byId("idDetail").data("actualMatnr");
		if (actualMat === null)
		{
			sap.ui.getCore().byId("App").to("idSearch");
		}
		else
		{
			sap.ui.getCore().byId("App").back();
		}

		//löschen der Items, sonst werden sie doppelt hinzugefügt
		this.getView().byId("idWishlistList").removeAllItems();

		this.onPressCancelBtn();
	},

	/** 
	 * Aufruf: immer wenn die Daten neu geladen werden müssen
	 * Funktion: neuladen der Daten und binden der Liste an das ausgewählte maModel
	 */
	loadData: function()
	{
		var oList = this.getView().byId("idWishlistList");
		oList.removeAllItems();
		var maModelData = sap.ui.getCore().getModel("maModel").getData().materials;
		var oView = this.getView();

		for (var i = 0; i < maModelData.length; i++)
		{
			if (maModelData[i].inWishlist === true)
			{
				var sDate = maModelData[i].wishlistDate.toString();
				var sDateData = sDate.substring(6, sDate.length - 2);

				var oDate = new Date();
				oDate.setTime(sDateData);
				var sDateParsed = oDate.toDateString();

				oList.addItem(
					new sap.m.ObjectListItem(
					{
						//Keine Suche mögl. da ich kein Model gebunden habe 
						title: maModelData[i].maktx,
						intro: maModelData[i].matnr,
						icon: "sap-icon://course-book",
						type: "Active",
						number: maModelData[i].preis,
						numberUnit: "€",
						showMarkers: true,
						markFavorite: maModelData[i].inWishlist,
						attributes: [
						    new sap.m.ObjectAttribute(
							{
								title: "Added to Wishlist Date",
								text: sDateParsed
							})
						            ],
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
							sap.ui.getCore().byId("App").to("idDetail");

							//löschen der Items, sonst werden sie doppelt hinzugefügt
							oView.byId("idWishlistList").removeAllItems();
						}
					}));
			}
		}
	},

	/** 
	 * Aufruf: beim drücken auf das Delete Icon
	 * Funktion: Setzten des Modes der Liste auf "Delete" und anzeigen des "Cancel"-Buttons
	 */
	onPressDeleteBtn: function()
	{
		var data = sap.ui.getCore().getModel("maModel").getData();
		var oWishlistList = this.getView().byId("idWishlistList");

		if (!data.materials[0]) //Wenn keine Daten drin sind 
		{
			sap.m.MessageToast.show("Your Cart is empty!");
		}
		else
		{
			if (oWishlistList.getMode() === sap.m.ListMode.Delete)
			{
				this.onPressCancelBtn();
			}
			else
			{
				oWishlistList.setMode("Delete"); //Mode der Tabelle auf Delete setzten --> Buttons erscheinen 
				oWishlistList.setSwipeDirection("LeftToRight");
				
				if (sap.ui.Device.support.touch === false)
				{
						var cancelBtn = this.getView().byId("idCancelBtnCart");
						cancelBtn.setEnabled(true);
						cancelBtn.setVisible(true);
				}
			}
		}
	},

	/** 
	 * Aufruf: beim drücken des "Cancel"-Buttons
	 * Funktion: Setzen des Modes der Liste auf "None" und verstecken des "Cancel"-Buttons
	 */
	onPressCancelBtn: function()
	{
		var oWishlistList = this.getView().byId("idWishlistList");
		oWishlistList.setMode("None");
		oWishlistList.setSwipeDirection("RightToLeft");

		var cancelBtn = this.getView().byId("idCancelBtnCart");
		cancelBtn.setEnabled(false);
		cancelBtn.setVisible(false);
	},

	/** 
	 * Aufruf: beim drücken des löschen Buttons
	 * Funktion: senden des Delete-Requests, neuladen der Daten und verstecken des "Cancel"-Buttons
	 *
	 * @param   {oControlEvent}   evt
	 */
	onDeleteItem: function(evt)
	{
		var oListItem = evt.getParameters().listItem;
		var matnr = oListItem.getIntro();
		var oController = this;
		var oModel = sap.ui.getCore().getModel("Service");

		oModel.remove("/WishlistSet(Kunnr='" + 13 + "',Matnr='" + matnr + "')", null, null,
			function(success)
			{
				console.log("Eintrag wurde von der Wishlist gelöscht: " + success);
			},
			function(error)
			{
				console.log("Fehler beim Löschen der Wishlist: " + error);
				sap.m.MessageToast.show("An Error occured! Please try again later.");

			});

		//Daten im neu laden 
		sap.ui.getCore().byId("idSearch").getController().loadData(); //Lädt den Detail schon selber neu 
		sap.ui.getCore().byId("idDetail").getController().loadCrossSelling();

		//Sollte in die Success Methode --> die wird aber nicht aufgerufen 
		var dialog = new sap.m.Dialog(
		{
			title: "Info",
			type: "Message",
			state: "Success",
			content: new sap.m.Text(
			{
				text: "Product " + matnr + " deleted from Wishlist!"
			}),
			beginButton: new sap.m.Button(
			{
				text: "OK",
				press: function()
				{
					dialog.close();
					oController.loadData();
				}
			})
		});

		dialog.open();

		this.onPressCancelBtn(); 
	}

	/**
	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
	 * (NOT before the first rendering! onInit() is used for that one!).
	 * @memberOf view.Wishlist
	 */
	//	onBeforeRendering: function() {
	//
	//	},

	/**
	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
	 * This hook is the same one that SAPUI5 controls get after being rendered.
	 * @memberOf view.Wishlist
	 */
	//	onAfterRendering: function() {
	//
	//	},

	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * @memberOf view.Wishlist
	 */
	//	onExit: function() {
	//
	//	}

});