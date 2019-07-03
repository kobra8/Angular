ALTER PROCEDURE [CustomerPanel].[GetArticleDetails]
                @languageId tinyint
   ,@articleId int 
   ,@customerId int
   ,@contactId smallint
   ,@cartId tinyint 
   ,@unitNo smallint   
   ,@warehouseId int
   ,@features CustomerPanel.ArticleParametersType readonly
   ,@erpLanguageId int
   ,@calculateDiscount bit
   ,@defaultTwrGroup int
   ,@stockFromWarehouse bit
   --,@companyUnitPath varchar(255)
   ,@companyUnitId int
   ,@stockFunctionXL bit
   ,@showImages bit
   ,@priceMode tinyint
   ,@isReverseCharge bit
   ,@reverseChargeVatValue decimal(5,2)
   ,@defaultWarehouseId int
   ,@warehouseName varchar(31)
   ,@quantityPriceValue tinyint
AS
BEGIN
                set nocount on;

                declare @isVatExport bit
                                  --,@paymentFormId tinyint
                                  --,@paymentDate int
                                  --,@deliveryMethodId smallint
                                  ,@featuresClassIdCount int
                                  ,@isFeaturesFiltered bit
                                  ,@data datetime
                                  ,@dataTS int
                                  ,@nettoWeight decimal(15,4) 
                                  ,@bruttoWeight decimal(15,4) 
                                  ,@weightResourceSymbolKey nvarchar(25) 
                                  ,@volume decimal(15,4) 
                                  ,@volumeResourceSymbolKey nvarchar(25)
                                  ,@defaultUnitNo int
                                  ,@changeWarehouseEnabled bit = CustomerPanel.CheckPersonPermission(@customerId,@contactId,2038)
                                  
   
                declare @currentPrice table(
                               TwC_TwrNumer int
        ,TwC_TwrLp smallint
                    ,TwC_Wartosc decimal(15,4)
                    ,TwC_Waluta varchar(3)
                  )

                                  
                                   
                DECLARE @permissionResult bit,
                                               @isAccessible bit = 0, 
                                               @itemExistsInCurrentPriceList bit = 0

                exec CustomerPanel.CheckProductPermissions @articleId, @defaultTwrGroup, @permissionResult output

                if(@permissionResult = 1)
                begin

                if exists (select * from CDN.TwrKarty where Twr_WCenniku = 1 and Twr_GidNumer = @articleId and Twr_GidTyp = 16)begin
                               select @isAccessible = 1
                end

                select @featuresClassIdCount=count(PTE_ClassId)      
                               from @features
                               join CDN.TwrKarty on PTE_ClassId=isnull(Twr_CCKNumer,0)    
                               where Twr_GIDNumer=@articleId
                               group by PTE_ClassId;

                               select @isFeaturesFiltered=0;
                               if @featuresClassIdCount=1
                                               select @isFeaturesFiltered=1;
                
                select @data=getdate();
                exec @dataTS=CDN.DateToTS @data;

                insert into @currentPrice select * from CustomerPanel.GetCurrentPrice(@articleId, isnull(CustomerPanel.GetBasePriceNo(@customerId, @articleId),-1), @dataTS)
                               
                               if exists (select * from @currentPrice)
                               begin
                                               select @itemExistsInCurrentPriceList = 1
                               end

                if(@isAccessible = 1 and @itemExistsInCurrentPriceList = 1)
                begin
                               
                               select @defaultTwrGroup=isnull(@defaultTwrGroup, 0);
                               select @stockFunctionXL=isnull(@stockFunctionXL, 0);

                               select @stockFromWarehouse=isnull(@stockFromWarehouse, 0)

                               if @warehouseId is null or @changeWarehouseEnabled = 0
                                               select @warehouseId=@defaultWarehouseId;

                               select @isVatExport=0;
                               if (exists(select top 1 Knt_GIDTyp from CDN.KntKarty where Knt_GIDNumer=@customerId and Knt_ExpoKraj<>1) and
                                               exists(select top 1 Dok_GIDTyp from CDN.DokDefinicje where Dok_GIDTyp=9472 and Dok_FrsID=@companyUnitId and Dok_VATEksportowy=1))
                                               select @isVatExport=1; 

                               --if @calculateDiscount=1
                               --begin
                               --            select @paymentFormId=isnull(Knt_FormaPl,0)                   
                               --                              ,@deliveryMethodId=Naz_GIDLp
                               --                              ,@paymentDate=isnull(Knt_LimitOkres,0)                                                        
                               --            from CDN.KntKarty
                               --            left join CDN.Nazwy on Naz_GIDTyp=976 and Naz_Nazwa=Knt_SposobDostawy
                               --            where Knt_GIDNumer=@customerId;

                               --            select @deliveryMethodId=isnull(@deliveryMethodId,0);
                               --end

                               exec CustomerPanel.GetArticleWeightAndVolume @articleId,@unitNo,@nettoWeight out,@bruttoWeight out,@weightResourceSymbolKey out,@volume out,@volumeResourceSymbolKey out
                               select @isFeaturesFiltered=0;
                               if @featuresClassIdCount=1
                                               select @isFeaturesFiltered=1;


                               select @defaultUnitNo=Twr_JMPulpitKnt from CDN.TwrKarty where Twr_GIDNumer = @articleId

                               exec CustomerPanel.GetArticleWeightAndVolume @articleId,@defaultUnitNo,@nettoWeight out,@bruttoWeight out,@weightResourceSymbolKey out,@volume out,@volumeResourceSymbolKey out

                                               select Name = isnull(n.TLM_Tekst,Twr_Nazwa)
                                 ,Code = isnull(Twr_kod,'')
                                 ,[Type] = isnull(Twr_Typ,1)
                                 ,IsUnitTotal = isnull(u.TwJ_Calkowita,isnull(Twr_JmCalkowita,0))
                                 ,DefaultUnitNo = isnull(Twr_JMPulpitKnt,0)
                                 ,BasicUnit = isnull(ut.TLM_Tekst,Twr_Jm)
                                 ,AuxiliaryUnit = isnull(at.TLM_Tekst,u.TwJ_JmZ)
                                 ,UnitLockChange = isnull(Twr_JMBlokujZmiane,0)                                                                         
                                 ,StockLevel = cast(case when @stockFunctionXL=0
                                                                                                              then replace(CDN.SubstringEx(isnull(replace(CDN.DokSumaStanowTowaru(Twr_GIDTyp,Twr_GIDFirma,Twr_GIDNumer,Twr_Typ,
                                                                                                                                                                                                                                                           cp.TwC_TwrLp,
                                                                                                                                                                                                                                                           1,                                                              
                                                                                                                                                                                                                                                            1,                                                                                                         
                                                                                                                                                                                                                                                           CDN.GidFirma(),                                            
                                                                                                                                                                                                                                                           @warehouseId,
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
                                                                 else CustomerPanel.GetItemsStockLevel(Twr_Typ,Twr_GIDNumer,@warehouseId,@features,@isFeaturesFiltered,isnull(i.Twr_CCKNumer,0),@companyUnitId,@customerId,@stockFromWarehouse)
                                                 end as decimal(15,4))
                                 ,Denominator = isnull(u.TwJ_PrzeliczM,1)
                                 ,Numerator = isnull(u.TwJ_PrzeliczL,1)
                                 ,BasePriceNo = cp.TwC_TwrLp
                                 ,ReverseCharge = case when @isReverseCharge=1 and isnull(Twr_Zlom,0)=1 then 1 else 0 end
                                 ,PurchasePrice = isnull(PPrice.Twc_Wartosc,0)                
                                 ,NetPrice = case when substring(n2.Naz_Nazwa,11,1)='N'
                                                                                                 then isnull(cp.Twc_Wartosc,0)
                                                                                                 else cast(isnull(cp.Twc_Wartosc,0)*100/(100+ case when (@isReverseCharge=1 and isnull(Twr_Zlom,0)=1)
                                                                                                                                                                                                                                                                                                                         then isnull(@reverseChargeVatValue,0)
                                                                                                                                                                                                                                                                                                                         else isnull(Twr_StawkaPodSpr,0) end) as decimal(15,4)) end
                                 ,GrossPrice = case when substring(n2.Naz_Nazwa,11,1)='B'
                                                                                                              then (case when @isVatExport=1
                                                                                                                                                             then cast(isnull(cp.Twc_Wartosc,0)*100/(100+ case when (@isReverseCharge=1 and isnull(Twr_Zlom,0)=1)
                                                                                                                                                                                                                                                                                                                                                                          then isnull(@reverseChargeVatValue,0)
                                                                                                                                                                                                                                                                                                                                                                          else isnull(Twr_StawkaPodSpr,0) end) as decimal(15,4))
                                                                                                                                                             else isnull(cp.Twc_Wartosc,0) end)
                                                                                                              else (case when @isVatExport=1 
                                                                                                                                                             then isnull(cp.Twc_Wartosc,0)
                                                                                                                                                             else cast((isnull(cp.Twc_Wartosc,0)+(isnull(cp.Twc_Wartosc,0)* case when (@isReverseCharge=1 and isnull(Twr_Zlom,0)=1)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      then isnull(@reverseChargeVatValue,0)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      else isnull(Twr_StawkaPodSpr,0) end/100)) as decimal(15,4)) end) end
                                 ,Currency = isnull(cp.TwC_Waluta,(select isnull(Price.TwC_Waluta,'') from CDN.ZwrocCeneAktualna(Twr_GIDNumer,Twr_CenaSpr,@dataTS) Price))
                                 ,[Description] = isnull(replace(TwO_Opis,char(13)+char(10),'<br/>'),'')
                                 ,Manufacturer = isnull(Knt_Nazwa1,'') +' '+ isnull(Knt_Nazwa2,'') +' '+ isnull(Knt_Nazwa3,'')
                                 ,ManufacturerUrl = isnull(Knt_Url,'')
                                 ,Manager = isnull(Prc_Nazwisko,'')+' '+isnull(Prc_Imie1,'') + case when isnull(Prc_Telefon1,'')<>'' then ' tel: ' + Prc_Telefon1 else '' end
                                 ,ManagerMail = isnull(Prc_EMail,'')
                                 ,ArticleUrl = isnull(Twr_Url,'')
                                 ,WMC = case when @priceMode=1 and isnull(K.SLW_WartoscN1,0) <> 0
                                                                                then cast(isnull(K.SLW_WartoscN1,0) * (isnull(Twr_StawkaPodSpr,0)/100 + 1) as decimal(9,2))
                                                                                else cast(isnull(K.SLW_WartoscN1,0) as decimal(9,2)) end
                                 ,Brand = isnull(M.SLW_WartoscS,'')
                                 ,VatRate = isnull(Twr_StawkaPodSpr,0)
                                 ,ArticleGroupId = isnull(TAP_GrupaeSklep,0)
                                 ,Flag = TaP_Flagi
                                 ,[Status] = Tap_Status
                                 ,[Availability] = Tap_Dostepnosc
                                 ,[AvailableFrom] = iif(Tap_Status=0 and (TAP_ZapowiedzDataOd!= 0 and TAP_ZapowiedzDataOd!=93890),dateadd(d, TAP_ZapowiedzDataOd, '18001228'),NULL)
                                 ,[DiscountAllowed] = cast(isnull(Tap_PodlegaRabatowaniu,1)as bit)
                                 ,NettoWeight = @nettoWeight 
                                 ,BruttoWeight = @bruttoWeight 
                                 ,WeightSymbolResourceKey = @weightResourceSymbolKey 
                                 ,Volume = @volume
                                 ,VolumeSymbolResourceKey = @volumeResourceSymbolKey
                                 ,[EAN] = Twr_Ean
                                 ,ItemExistsInCurrentPriceList = @itemExistsInCurrentPriceList
                from CDN.TwrKarty i
                left join CDN.Slowniki K on K.SLW_ID=Twr_StawkaKGO
                left join CDN.Slowniki M on M.SLW_ID=Twr_MarkaId
                left join CDN.TwrOpisy on Twr_GIDNumer=TwO_TwrNumer and TwO_Jezyk=@erpLanguageId
                left join CDN.Tlumaczenia n on i.Twr_GIDTyp=n.TLM_Typ and i.Twr_GIDNumer=n.TLM_Numer and n.TLM_Jezyk=@erpLanguageId and n.TLM_Pole=2
                join CDN.Nazwy on Naz_GIDTyp=144 and Naz_Nazwa=i.Twr_Jm
                left join CDN.Tlumaczenia ut on ut.TLM_Typ=144 and ut.TLM_Numer=Naz_GIDLp and ut.TLM_Jezyk=@erpLanguageId and ut.TLM_Pole=2
                join @currentPrice as cp on Twr_GIDNumer = cp.TwC_TwrNumer
                left join CDN.TwrCeny PPrice on PPrice.TwC_TwrTyp=Twr_GIDTyp and PPrice.TwC_TwrNumer=Twr_GIDNumer and PPrice.TwC_TwrLp=0                                                     
                join CDN.Nazwy n2 on n2.Naz_GIDTyp=64 and n2.Naz_GIDLp=cp.TwC_TwrLp
                left join CDN.PrcKarty on i.Twr_PrcTyp=Prc_GIDTyp and i.Twr_PrcNumer=Prc_GIDNumer
                left join CDN.KntKarty on i.Twr_PrdTyp=Knt_GIDTyp and i.Twr_PrdNumer=Knt_GIDNumer
                left join CDN.TwrJm u on Twr_GIDNumer=u.TwJ_Twrnumer and u.TwJ_TwrLp=@defaultUnitNo and u.TwJ_PulpitKnt=1 and u.TwJ_TypJm<>3
                left join CDN.Nazwy n1 on n1.Naz_GIDTyp=144 and n1.Naz_Nazwa=u.TwJ_JmZ
                left join CDN.Tlumaczenia at on at.TLM_Typ=144 and at.TLM_Numer=n1.Naz_GIDLp and at.TLM_Jezyk=@erpLanguageId and at.TLM_Pole=2
                LEFT OUTER JOIN CDN.TwrAplikacje ON Twr_GIDNumer = TAP_ObiNumer and  TAP_ObiTyp = 16
                where Twr_GIDNumer=@articleId and i.Twr_Wcenniku = 1;

                if(@calculateDiscount = 1)
                begin
                exec CustomerPanel.GetCustomerDiscountParameters @customerId,@contactId,@cartId,@warehouseId, @defaultWarehouseId, @companyUnitId, @warehouseName, @quantityPriceValue;
                end
                else
                begin
                select top 0 0
                end

                select top 1 Id = PTE_ClassId
                                 ,Name = isnull(f.TLM_Tekst,isnull(CCK_Nazwa,''))
                                 ,Value = PTE_Value
                                 ,TranslationValue = isnull(v.TLM_Tekst, PTE_Value)
                from CDN.TwrKarty
                join @features on Twr_CCKNumer=PTE_ClassId 
                join CDN.CechyKlasy on PTE_ClassId=CCK_GIDNumer
                left join CDN.Tlumaczenia f on f.TLM_Typ=192 and CCK_GIDNumer=f.TLM_Numer and CCK_GIDLp=f.TLM_Lp and f.TLM_Jezyk=@erpLanguageId and f.TLM_Pole=2
                left join CDN.Cechy on PTE_ClassId=CCH_GIDNumer and PTE_Value=CCh_Cecha and CCh_GIDTyp=192
                left join CDN.Tlumaczenia v on v.TLM_Typ=192 and PTE_ClassId=v.TLM_Numer and CCh_GIDLp=v.TLM_Lp and v.TLM_Jezyk=@erpLanguageId and v.TLM_Pole=2
                where Twr_GIDNumer=@articleId and Twr_Wcenniku = 1;

                exec CustomerPanel.GetAttributes @erpLanguageId, 16, @articleId, 0, 0;

                select distinct Id = Twr_GIDNumer
                                 ,ImageId = CustomerPanel.GetArticleImage(i.Twr_GIDNumer,@showImages)
                                 ,Name = isnull(n.TLM_Tekst,Twr_Nazwa)
                                 ,Code = isnull(Twr_kod,'')
                                 ,[Type] = isnull(Twr_Typ,1)        
                                 ,IsUnitTotal = isnull(Twr_JmCalkowita,0)
                                 ,BasicUnit = isnull(ut.TLM_Tekst,Twr_Jm)
                                 ,DefaultUnitNo = isnull(Twr_JMPulpitKnt,0)
                                 ,HowMuch = TwP_PrzeliczL
                                 ,ForHowMuch = TwP_PrzeliczM
                                 ,StockLevel = cast(case when @stockFunctionXL=0
                                                                                                                               then replace(CDN.SubstringEx(isnull(replace(CDN.DokSumaStanowTowaru(Twr_GIDTyp,Twr_GIDFirma,Twr_GIDNumer,Twr_Typ,
                                                                                                                                                                                                                                                           cp.TwC_TwrLp,
                                                                                                                                                                                                                                                           1,                                                              
                                                                                                                                                                                                                                                            1,                                                                                                         
                                                                                                                                                                                                                                                           CDN.GidFirma(),                                            
                                                                                                                                                                                                                                                           @warehouseId,
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
                                                                 else CustomerPanel.GetItemsStockLevel(Twr_Typ,Twr_GIDNumer,@warehouseId,@features,@isFeaturesFiltered,isnull(i.Twr_CCKNumer,0),@companyUnitId,@customerId,@stockFromWarehouse)
                                                  end as decimal(15,4))
                                 ,BasePriceNo = cp.TwC_TwrLp
                                 ,ReverseCharge = case when @isReverseCharge=1 and isnull(Twr_Zlom,0)=1 then 1 else 0 end
                                 ,PurchasePrice = isnull(PPrice.Twc_Wartosc,0)
                                 ,NetPrice = case when substring(n2.Naz_Nazwa,11,1)='N'
                                                                                                 then isnull(cp.Twc_Wartosc,0)
                                                                                                 else cast(isnull(cp.Twc_Wartosc,0)*100/(100+ case when (@isReverseCharge=1 and isnull(Twr_Zlom,0)=1)
                                                                                                                                                                                                                                                                                                                         then isnull(@reverseChargeVatValue,0)
                                                                                                                                                                                                                                                                                                                         else isnull(Twr_StawkaPodSpr,0) end) as decimal(15,4)) end
                                 ,GrossPrice = case when substring(n2.Naz_Nazwa,11,1)='B'
                                                                                                              then (case when @isVatExport=1
                                                                                                                                                             then cast(isnull(cp.Twc_Wartosc,0)*100/(100 + case when (@isReverseCharge=1 and isnull(Twr_Zlom,0)=1)
                                                                                                                                                                                                                                                                                                                                                                           then isnull(@reverseChargeVatValue,0)
                                                                                                                                                                                                                                                                                                                                                                           else isnull(Twr_StawkaPodSpr,0) end) as decimal(15,4))
                                                                                                                                                             else isnull(cp.Twc_Wartosc,0) end)
                                                                                                              else (case when @isVatExport=1 
                                                                                                                                                             then isnull(cp.Twc_Wartosc,0)
                                                                                                                                                             else cast((isnull(cp.Twc_Wartosc,0)+(isnull(cp.Twc_Wartosc,0)* case when (@isReverseCharge=1 and isnull(Twr_Zlom,0)=1)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      then isnull(@reverseChargeVatValue,0)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      else isnull(Twr_StawkaPodSpr,0) end/100)) as decimal(15,4)) end) end
                                 ,Currency = isnull(cp.TwC_Waluta,(select isnull(Price.TwC_Waluta,'') from CDN.ZwrocCeneAktualna(Twr_GIDNumer,Twr_CenaSpr,@dataTS) Price))
                                 ,Flag = TaP_Flagi
                                 ,[Status] = Tap_Status
                                 ,[Availability] = Tap_Dostepnosc
                                 ,[AvailableFrom] = iif(Tap_Status=0 and (TAP_ZapowiedzDataOd!= 0 and TAP_ZapowiedzDataOd!=93890),dateadd(d, TAP_ZapowiedzDataOd, '18001228'),NULL)
                                 ,[DiscountAllowed] = cast(isnull(Tap_PodlegaRabatowaniu,1)as bit)
                                 ,ItemExistsInCurrentPriceList = @itemExistsInCurrentPriceList
                from CDN.TwrKarty i
                               join 
                               (
                                               select TwP_Id, TwP_ZamNumer, TwP_PrzeliczL, TwP_PrzeliczM from CDN.TwrPodm where TwP_Warstwa=0 and TwP_TwrNumer=@articleId and TwP_DokRodzaj in (1,3)
                                               union all
                                               select B.TwP_Id, B.TwP_ZamNumer, B.TwP_PrzeliczL, B.TwP_PrzeliczM from CDN.TwrPodm A join CDN.TwrPodm B on A.TwP_Warstwa=B.TwP_Warstwa and A.TwP_Warstwa>1
                                               where A.TwP_ZamNumer=@articleId and B.TwP_ZamNumer<>@articleId and A.TwP_Warstwa>1 and A.TwP_DokRodzaj in (1,3)
                               ) ArtPodm on ArtPodm.TwP_ZamNumer=i.Twr_GIDNumer
                               left join CDN.Tlumaczenia n on i.Twr_GIDTyp=n.TLM_Typ and i.Twr_GIDNumer=n.TLM_Numer and n.TLM_Jezyk=@erpLanguageId and n.TLM_Pole=2
                               join CDN.Nazwy on Naz_GIDTyp=144 and Naz_Nazwa=i.Twr_Jm
                               left join CDN.Tlumaczenia ut on ut.TLM_Typ=144 and ut.TLM_Numer=Naz_GIDLp and ut.TLM_Jezyk=@erpLanguageId and ut.TLM_Pole=2
                               cross apply CustomerPanel.GetCurrentPrice(@articleId, isnull(CustomerPanel.GetBasePriceNo(@customerId, @articleId),-1), @dataTS) as cp
                               join CDN.Nazwy n2 on n2.Naz_GIDTyp=64 and n2.Naz_GIDLp=cp.TwC_TwrLp
                               left join CDN.TwrCeny PPrice on PPrice.TwC_TwrTyp=Twr_GIDTyp and PPrice.TwC_TwrNumer=Twr_GIDNumer and PPrice.TwC_TwrLp=0      
                               left join CDN.FrsZamienniki on TwP_Id=FrZ_TwPId
                               LEFT OUTER JOIN CDN.TwrAplikacje ON Twr_GIDNumer = TAP_ObiNumer and Twr_GIDTyp = TAP_ObiTyp 
                where Twr_GIDNumer>0 and Twr_Archiwalny=0 and Twr_WCenniku=1
                                 and case when exists(select top 1 FrL_GIDTyp from CDN.FrmLinki where (FRZ_FrsId=FRL_GrONumer or FRZ_FrsId=FRL_GIDNumer) and FrL_GrOTyp=-4272 and FrL_GIDTyp=-4272 and FrL_GIDNumer=@companyUnitId) then 1 else 0 end=1
                                 and exists(select top 1 TwL_GIDTyp from CDN.TwrLinki where TwL_GIDTyp=Twr_GIDTyp and TwL_GIDNumer=Twr_GIDNumer and Twr_WCenniku=1 and TwL_GrONumer=@defaultTwrGroup)
                                 and Twr_Wcenniku = 1;

                               select 0 as 'blank'
                               select @permissionResult as 'haveAccess'
                               select @isAccessible as 'IsAccessible', ItemExistsInCurrentPriceList = @itemExistsInCurrentPriceList
                               end
                               else
                               begin

                               select 0 as 'blank'
                               select 0 as 'blank'
                               select 0 as 'blank'
                               select 0 as 'blank'

                               select 0 as 'blank'
                               select 0 as 'blank'
                               select 0 as 'blank'
                               select 0 as 'blank'

                               select @permissionResult as 'haveAccess'
                               select @isAccessible as 'IsAccessible', ItemExistsInCurrentPriceList = @itemExistsInCurrentPriceList

                               end
                end
                else
                begin

                               select 0 as 'blank'
                               select 0 as 'blank'
                               select 0 as 'blank'
                               select 0 as 'blank'

                               select 0 as 'blank'
                               select 0 as 'blank'
                               select 0 as 'blank'
                               select 0 as 'blank'

                               select @permissionResult as 'haveAccess'
                               select @isAccessible as 'IsAccessible', ItemExistsInCurrentPriceList = @itemExistsInCurrentPriceList
                end
                
                exec CustomerPanel.CheckDiscountPermission @customerId, @contactId, @articleId
                select @changeWarehouseEnabled as 'changeWarehouseEnabled'
                
END
