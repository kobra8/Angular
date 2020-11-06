
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 
ALTER PROCEDURE [CustomerPanel].[GetCartDetails]
	@ids CustomerPanel.ResultIdsType readonly
   ,@languageId tinyint
   ,@customerId int
   ,@contactId smallint
   ,@documentTypeId smallint
   ,@cartId tinyint
   ,@onlyItems bit
   ,@skip int
   ,@take int
AS
BEGIN
	set nocount on;
	declare @dictionaryLangId int
		   ,@headerId int       
		   ,@companyUnitPath varchar(255)
		   ,@companyUnitId int
		   ,@stockFunctionXL bit
		   ,@stockFromWarehouse bit
		   ,@showImages bit
		   ,@Stan decimal (15,4);
		   				  
	select @dictionaryLangId=SLW_ID
	from CDN.Slowniki
	where SLW_Predefiniowany=(case @languageId when 2 then 21 when 3 then 34 when 4 then 22 when 5 then 24
											   when 6 then 35 when 7 then 23 when 8 then 36 when 9 then 100
											   when 10 then 98 when 11 then 99 when 12 then 101 else 20 end);

	select @companyUnitPath=CustomerPanel.GetCompanyUnitPath(@customerId);
	select @companyUnitId=CDN.SubstringEx(@companyUnitPath,',',1);
	select @stockFunctionXL=rtrim(Kon_Wartosc) from CDN.Konfig where Kon_Numer=2316;
	select @showImages=rtrim(Kon_Wartosc) from CDN.Konfig where Kon_Numer=2321;

	if @stockFunctionXL=0
		select @stockFromWarehouse=isnull(Kon_Wartosc,0) from CDN.Konfig where Kon_Numer=2315;

	select @headerId=HDR_Id
	from CustomerPanel.Headers
	where HDR_CustomerId=@customerId and HDR_ContactId=@contactId and HDR_Cart=@cartId and isnull(HDR_DocumentId,0)=0;

	if not exists(select top 1 Id from @ids)
	begin
		select Id = Twr_GIDNumer
			  ,No = ITS_No
			  ,ImageId = CustomerPanel.GetArticleImage(Twr_GIDNumer, @showImages)
			  ,ItemId = ITS_Id
			  ,Code = isnull(Twr_Kod,'')
			  ,Name
			  ,[Type] = isnull(Twr_Typ,1)
			  ,IsUnitTotal = isnull(u.TwJ_Calkowita,isnull(Twr_JmCalkowita,0))
			  ,DefaultUnitNo = ITS_UnitDefault
			  ,BasicUnit = isnull(ut.TLM_Tekst,Twr_Jm)
			  ,AuxiliaryUnit = isnull(at.TLM_Tekst,u.TwJ_JmZ)
			  ,StockLevel = cast(case when @stockFunctionXL=1
									  then replace(CDN.SubstringEx(isnull(replace(CDN.DokSumaStanowTowaru(Twr_GIDTyp,Twr_GIDFirma,Twr_GIDNumer,Twr_Typ,
																	 isnull(ITS_BasePriceNo,Twr_CenaSpr),
																	 1,
																	 1,
																	 CDN.GidFirma(),
																	 HDR_WarehouseId,
																	 0,
																	 0,
																	 0,
																	 datediff(day,convert(datetime,'28-12-1800',105),getdate()),
																	 0,
																	 1,
																	 @companyUnitId,
																	 @companyUnitId,
																	 0,
																	 0,0,0,0,default),'-','0:'),'0:'),':',1),',','.')
					  else CustomerPanel.GetCartItemStockLevel(Twr_Typ,Twr_GIDNumer,HDR_WarehouseId,ITS_Feature,isnull(Twr_CCKNumer,0),@companyUnitId,@customerId,@stockFromWarehouse)
				   end as decimal(15,4))
				--BB Modyfikacja
			  	,Stan = cast(case when @stockFunctionXL=1
									  then replace(CDN.SubstringEx(isnull(replace(CDN.DokSumaStanowTowaru(Twr_GIDTyp,Twr_GIDFirma,Twr_GIDNumer,Twr_Typ,
																	 isnull(ITS_BasePriceNo,Twr_CenaSpr),
																	 1,
																	 1,
																	 CDN.GidFirma(),
																	 HDR_WarehouseId,
																	 0,
																	 0,
																	 0,
																	 datediff(day,convert(datetime,'28-12-1800',105),getdate()),
																	 0,
																	 1,
																	 @companyUnitId,
																	 @companyUnitId,
																	 0,
																	 0,0,0,0,default),'-','0:'),'0:'),':',1),',','.')
					  else CustomerPanel.GetCartItemStockLevel(Twr_Typ,Twr_GIDNumer,HDR_WarehouseId,ITS_Feature,isnull(Twr_CCKNumer,0),@companyUnitId,@customerId,@stockFromWarehouse)
				   end as decimal(15,4))
			  ,Quantity = cast(ITS_Quantity*isnull(u.TwJ_PrzeliczM,1)/isnull(u.TwJ_PrzeliczL,1) as decimal(15,4))
			  --BB Modyfikacja
			  ,Koszyk = cast(ITS_Quantity*isnull(u.TwJ_PrzeliczM,1)/isnull(u.TwJ_PrzeliczL,1) as decimal(15,4))  
			  --
			  ,Discount = ITS_Discount
			  ,Denominator = isnull(u.TwJ_PrzeliczM,1)
			  ,Numerator = isnull(u.TwJ_PrzeliczL,1)
			  ,SubtotalPrice = cast(case when HDR_VatDirection='N' then ITS_FinalPrice else ITS_FinalPrice*100/(100+ITS_VatValue) end * isnull(u.TwJ_PrzeliczL,1)/isnull(u.TwJ_PrzeliczM,1) as decimal(15,4))
			  ,TotalPrice = cast(case when HDR_VatDirection='B' then ITS_FinalPrice else (ITS_FinalPrice+(ITS_FinalPrice*ITS_VatValue/100)) end * isnull(u.TwJ_PrzeliczL,1)/isnull(u.TwJ_PrzeliczM,1) as decimal(15,4))	  
			  ,SubtotalValue = cast(ITS_Quantity*case when HDR_VatDirection='N' then ITS_FinalPrice else ITS_FinalPrice*100/(100+ITS_VatValue) end as decimal(15,2)) 
			  ,TotalValue = cast(ITS_Quantity*case when HDR_VatDirection='B' then ITS_FinalPrice else (ITS_FinalPrice+(ITS_FinalPrice*ITS_VatValue/100)) end as decimal(15,2))	  
			  ,Currency = ITS_Currency
			  ,FromQuote = isnull(ITS_FromQuote,0)
		from (
			select RowNumber = row_number() over(order by Twr_GIDTyp)
				  ,Twr_GIDNumer
				  ,Twr_Kod
				  ,Name = isnull(TLM_Tekst,Twr_Nazwa)
				  ,Twr_Typ
				  ,Twr_JmCalkowita
				  ,Twr_Jm
				  ,Twr_GIDTyp
				  ,Twr_GIDFirma
				  ,Twr_CenaSpr
				  ,Twr_CCKNumer
				  ,ITS_No
				  ,ITS_Id
				  ,ITS_UnitDefault
				  ,ITS_BasePriceNo
				  ,HDR_WarehouseId
				  ,ITS_Feature
				  ,ITS_Quantity
				  ,ITS_Discount
				  ,HDR_VatDirection
				  ,ITS_FinalPrice
				  ,ITS_VatValue
				  ,ITS_Currency
				  ,ITS_FromQuote
			from CDN.TwrKarty
			join CustomerPanel.Items on Twr_GIDNumer=ITS_ArticleId
			join CustomerPanel.Headers on ITS_HeaderId=HDR_Id
			left join CDN.Tlumaczenia on TLM_Typ=Twr_GIDTyp and TLM_Numer=Twr_GIDNumer and TLM_Pole=2 and TLM_Jezyk=@dictionaryLangId	
			where ITS_HeaderId=@headerId				  
		) i
		join CDN.Nazwy on Naz_GIDTyp=144 and Naz_Nazwa=i.Twr_Jm
		left join CDN.Tlumaczenia ut on ut.TLM_Typ=144 and Naz_GIDLp=ut.TLM_Numer and ut.TLM_Jezyk=@dictionaryLangId and ut.TLM_Pole=2
		left join CDN.TwrJm u on i.Twr_GIDNumer=u.TwJ_Twrnumer and u.TwJ_TwrLp=i.ITS_UnitDefault
		left join CDN.Nazwy n1 on n1.Naz_GIDTyp=144 and n1.Naz_Nazwa=u.TwJ_JmZ
		left join CDN.Tlumaczenia at on at.TLM_Typ=144 and n1.Naz_GIDLp=at.TLM_Numer and at.TLM_Jezyk=@dictionaryLangId and at.TLM_Pole=2
		where RowNumber between @skip and @skip+@take;
	end
	else
	begin
		select Id = Twr_GIDNumer
			  ,No = ITS_No
			  ,ImageId = CustomerPanel.GetArticleImage(Twr_GIDNumer, @showImages)
			  ,ItemId = ITS_Id
			  ,Code = isnull(Twr_Kod,'')
			  ,Name
			  ,[Type] = isnull(Twr_Typ,1)
			  ,IsUnitTotal = isnull(u.TwJ_Calkowita,isnull(Twr_JmCalkowita,0))
			  ,DefaultUnitNo = ITS_UnitDefault
			  ,BasicUnit = isnull(ut.TLM_Tekst,Twr_Jm)
			  ,AuxiliaryUnit = isnull(at.TLM_Tekst,u.TwJ_JmZ)
			  ,StockLevel = cast(case when @stockFunctionXL=1
									  then replace(CDN.SubstringEx(isnull(replace(CDN.DokSumaStanowTowaru(Twr_GIDTyp,Twr_GIDFirma,Twr_GIDNumer,Twr_Typ,
																	 isnull(ITS_BasePriceNo,Twr_CenaSpr),
																	 1,
																	 1,
																	 CDN.GidFirma(),
																	 HDR_WarehouseId,
																	 0,
																	 0,
																	 0,
																	 datediff(day,convert(datetime,'28-12-1800',105),getdate()),
																	 0,
																	 1,
																	 @companyUnitId,
																	 @companyUnitId,
																	 0,
																	 0,0,0,0,default),'-','0:'),'0:'),':',1),',','.')
					  else CustomerPanel.GetCartItemStockLevel(Twr_Typ,Twr_GIDNumer,HDR_WarehouseId,ITS_Feature,isnull(Twr_CCKNumer,0),@companyUnitId,@customerId,@stockFromWarehouse)
				   end as decimal(15,4))
				--BB Modyfikacja
			  	,Stan = cast(case when @stockFunctionXL=1
									  then replace(CDN.SubstringEx(isnull(replace(CDN.DokSumaStanowTowaru(Twr_GIDTyp,Twr_GIDFirma,Twr_GIDNumer,Twr_Typ,
																	 isnull(ITS_BasePriceNo,Twr_CenaSpr),
																	 1,
																	 1,
																	 CDN.GidFirma(),
																	 HDR_WarehouseId,
																	 0,
																	 0,
																	 0,
																	 datediff(day,convert(datetime,'28-12-1800',105),getdate()),
																	 0,
																	 1,
																	 @companyUnitId,
																	 @companyUnitId,
																	 0,
																	 0,0,0,0,default),'-','0:'),'0:'),':',1),',','.')
					  else CustomerPanel.GetCartItemStockLevel(Twr_Typ,Twr_GIDNumer,HDR_WarehouseId,ITS_Feature,isnull(Twr_CCKNumer,0),@companyUnitId,@customerId,@stockFromWarehouse)
				   end as decimal(15,4))
			  ,Quantity = cast(ITS_Quantity*isnull(u.TwJ_PrzeliczM,1)/isnull(u.TwJ_PrzeliczL,1) as decimal(15,4))
			  --BB Modyfikacja
			  ,Koszyk = cast(ITS_Quantity*isnull(u.TwJ_PrzeliczM,1)/isnull(u.TwJ_PrzeliczL,1) as decimal(15,4)) 
			  --
			  ,Discount = ITS_Discount
			  ,Denominator = isnull(u.TwJ_PrzeliczM,1)
			  ,Numerator = isnull(u.TwJ_PrzeliczL,1)
			  ,SubtotalPrice = cast(case when HDR_VatDirection='N' then ITS_FinalPrice else ITS_FinalPrice*100/(100+ITS_VatValue) end * isnull(u.TwJ_PrzeliczL,1)/isnull(u.TwJ_PrzeliczM,1) as decimal(15,4))
			  ,TotalPrice = cast(case when HDR_VatDirection='B' then ITS_FinalPrice else (ITS_FinalPrice+(ITS_FinalPrice*ITS_VatValue/100)) end * isnull(u.TwJ_PrzeliczL,1)/isnull(u.TwJ_PrzeliczM,1) as decimal(15,4))	  
			  ,SubtotalValue = cast(ITS_Quantity*case when HDR_VatDirection='N' then ITS_FinalPrice else ITS_FinalPrice*100/(100+ITS_VatValue) end as decimal(15,2)) 
			  ,TotalValue = cast(ITS_Quantity*case when HDR_VatDirection='B' then ITS_FinalPrice else (ITS_FinalPrice+(ITS_FinalPrice*ITS_VatValue/100)) end as decimal(15,2))	  
			  ,Currency = ITS_Currency
			  ,FromQuote = isnull(ITS_FromQuote,0)
		from (
			select RowNumber = row_number() over(order by Id)
				  ,Twr_GIDNumer
				  ,Twr_Kod
				  ,Name = isnull(TLM_Tekst,Twr_Nazwa)
				  ,Twr_Typ
				  ,Twr_JmCalkowita
				  ,Twr_Jm
				  ,Twr_GIDTyp
				  ,Twr_GIDFirma
				  ,Twr_CenaSpr
				  ,Twr_CCKNumer
				  ,ITS_No
				  ,ITS_Id
				  ,ITS_UnitDefault
				  ,ITS_BasePriceNo
				  ,HDR_WarehouseId
				  ,ITS_Feature
				  ,ITS_Quantity
				  ,ITS_Discount
				  ,HDR_VatDirection
				  ,ITS_FinalPrice
				  ,ITS_VatValue
				  ,ITS_Currency
				  ,ITS_FromQuote
		    from @ids
			join CDN.TwrKarty on ResultId=Twr_GIDNumer
			join CustomerPanel.Items on Twr_GIDNumer=ITS_ArticleId
			join CustomerPanel.Headers on ITS_HeaderId=HDR_Id
			left join CDN.Tlumaczenia on TLM_Typ=Twr_GIDTyp and TLM_Numer=Twr_GIDNumer and TLM_Pole=2 and TLM_Jezyk=@dictionaryLangId	
			where ITS_HeaderId=@headerId				  
		) i
		join CDN.Nazwy on Naz_GIDTyp=144 and Naz_Nazwa=i.Twr_Jm
		left join CDN.Tlumaczenia ut on ut.TLM_Typ=144 and Naz_GIDLp=ut.TLM_Numer and ut.TLM_Jezyk=@dictionaryLangId and ut.TLM_Pole=2
		left join CDN.TwrJm u on i.Twr_GIDNumer=u.TwJ_Twrnumer and u.TwJ_TwrLp=i.ITS_UnitDefault
		left join CDN.Nazwy n1 on n1.Naz_GIDTyp=144 and n1.Naz_Nazwa=u.TwJ_JmZ
		left join CDN.Tlumaczenia at on at.TLM_Typ=144 and n1.Naz_GIDLp=at.TLM_Numer and at.TLM_Jezyk=@dictionaryLangId and at.TLM_Pole=2
		where RowNumber between @skip and @skip+@take;
	end

	exec CustomerPanel.GetConfigurationParameters @customerId, @contactId, @cartId, 0, @companyUnitPath, @showImages=@showImages;

	if @onlyItems = 0
	begin
		declare @getDeliveryCost bit
			   ,@stockLevelMode tinyint
			   ,@creditLimitMode tinyint
			   ,@isConfirm tinyint;

		select @getDeliveryCost=rtrim(Kon_Wartosc) from CDN.Konfig where Kon_Numer=2311;
		select @stockLevelMode=rtrim(Kon_Wartosc) from CDN.Konfig where Kon_Numer=2326;
	
		select @creditLimitMode=rtrim(Dok_KntLimitPrawo)
		      ,@isConfirm = isnull(KAP_CzyPotwierdzone,0)
		from CDN.DokDefinicje
		join CDN.OpeKarty on Dok_FrsId=Ope_FrsId
		join CDN.KntAplikacje on KAp_OpeNumer=Ope_GIDNumer
		join CDN.KntKarty on Knt_GIDNumer=KAp_KntNumer
		where Dok_GIDTyp=9472 and KAp_KntNumer=@customerId and KAp_KntTyp=32;
						
		select AddressId = HDR_AddressId
			  ,Address = isnull(KnA_Ulica,'') +' '+ isnull(KnA_KodP,'') +' '+ isnull(KnA_Miasto,'')
			  ,CompletionEntirely = isnull(HDR_CompletionEntirely,0)
			  ,ReceiptDate = isnull(convert(char(10),dateadd(day,HDR_ReceiptDate,'18001228'),121),convert(char(10),getdate(),121))
			  ,DeliveryMethod = isnull(Naz_Nazwa,'')
			  ,TranslationDeliveryMethod = isnull(d.TLM_Tekst, isnull(Naz_Nazwa,''))
			  ,Description = isnull(HDR_Description,'')
			  ,DescriptionSI = isnull(HDR_DescriptionSI,'')
			  ,SourceNumber = isnull(HDR_SourceNumber,'')
			  ,SourceNumberSI = isnull(HDR_SourceNumberSI,'')
			  ,VatDirection = HDR_VatDirection
			  ,WarehouseId = HDR_WarehouseId
			  ,WarehouseName = isnull('['+MAG_Kod+']'+ ' ' + isnull(w.TLM_Tekst,Mag_Nazwa), CustomerPanel.GetResource(@languageId,'AllWarehouse'))
			  ,PaymentFormId = HDR_PaymentFormId
			  ,PaymentForm = isnull(p.TLM_Tekst,HDR_PaymentForm)
			  ,DueDate = convert(char(10),dateadd(day,HDR_PaymentDate,getdate()), 126)
			  ,DeliveryMethodChange = CustomerPanel.CheckPermission(@customerId, @contactId, 2018)
			  ,ReceiptDateChange = CustomerPanel.CheckPermission(@customerId, @contactId, 2019)
			  ,ShowDeliveryMethod = CustomerPanel.CheckPermission(@customerId, @contactId, 2020)
			  ,ShowCompletion = CustomerPanel.CheckPermission(@customerId, @contactId, 2021)
			  ,ShowDiscount = CustomerPanel.CheckPermission(@customerId, @contactId, 2022)
			  ,PaymentFormChange = CustomerPanel.CheckPermission(@customerId, @contactId, 2026)
			  ,PaymentDateChange = CustomerPanel.CheckPermission(@customerId, @contactId, 2027)
			  ,WarehouseChange = CustomerPanel.CheckPermission(@customerId, @contactId, 2028)
			  ,IsDeliveryCost = @getDeliveryCost
			  ,StockLevelMode = @stockLevelMode
			  ,CreditLimitMode = @creditLimitMode			  
			  ,ShowFeatures = 0
			  ,CreateInquiries = CustomerPanel.CheckPermission(@customerId, @contactId, 2030)
			  ,IsConfirm = @isConfirm
			  ,HeaderId = @headerId 
		from CustomerPanel.Headers
		left join CDN.KntAdresy on HDR_AddressId=KnA_GIDNumer 
		left join CDN.Konfig on Kon_Numer=736 and HDR_PaymentFormId=Kon_Lp
		left join CDN.Tlumaczenia p on p.TLM_Typ=Kon_Numer and p.TLM_Numer=Kon_Lp and p.TLM_Jezyk=@dictionaryLangId and p.TLM_Pole=2
		left join CDN.Nazwy on Naz_GIDTyp=976 and HDR_DeliveryMethod=Naz_Nazwa
		left join CDN.Tlumaczenia d on d.TLM_Typ=976 and Naz_GIDLp=d.TLM_Numer and d.TLM_Jezyk=@dictionaryLangId and d.TLM_Pole=2
		left join CDN.Magazyny on MAG_GIDNumer=HDR_WarehouseId
		left join CDN.Tlumaczenia w on w.TLM_Typ=208 and MAG_GIDNumer=w.TLM_Numer and w.TLM_Jezyk=@dictionaryLangId and w.TLM_Pole=2
		where HDR_Id=@headerId;

		exec CustomerPanel.GetAttributesToFill @dictionaryLangId, @customerId, @contactId, @cartId, @documentTypeId, 0;
	    
		exec CustomerPanel.GetCartSummary @headerId, @customerId, @contactId, 0, @getDeliveryCost;
	end
END
	
