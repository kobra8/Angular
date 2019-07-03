ALTER PROCEDURE [CustomerPanel].[GetStockLevelAndCurrency]
       @customerId int
       ,@contactId int
       ,@articleId int
       ,@companyUnitId int
       ,@warehouseId int
       ,@stockFunctionXL bit
       ,@features CustomerPanel.ArticleParametersType readonly
       ,@stockFromWarehouse bit
       ,@defaultWarehouseId int
       ,@erpLanguageId int
AS
BEGIN
       set nocount on;

       declare @data datetime
                ,@dataTS int
                ,@itemExistsInCurrentPriceList bit
                ,@isFeaturesFiltered bit
                ,@basePriceNo int
                ,@changeWarehouseEnabled bit = CustomerPanel.CheckPersonPermission(@customerId,@contactId,2038)

       declare @currentPrice table(
             TwC_TwrNumer int
        ,TwC_TwrLp smallint
           ,TwC_Wartosc decimal(15,4)
           ,TwC_Waluta varchar(3)
         )

         select @stockFromWarehouse = isnull(@stockFromWarehouse ,0)


         if @warehouseId is null or @changeWarehouseEnabled = 0
                    select @warehouseId=@defaultWarehouseId;


         select @isFeaturesFiltered=0;
             if exists(select top 1 PTE_ClassId from @features)
                    select @isFeaturesFiltered=1;

         select @data=getdate();
         exec @dataTS=CDN.DateToTS @data;

         select @basePriceNo = CustomerPanel.GetBasePriceNo(@customerId, @articleId)
         insert into @currentPrice select * from CustomerPanel.GetCurrentPrice(@articleId, isnull(@basePriceNo,-1), @dataTS)
         
         if not exists (select * from @currentPrice)
         begin
             select @itemExistsInCurrentPriceList = 0;
             select ItemExistsInCurrentPriceList = @itemExistsInCurrentPriceList
         end
         else
         begin
             select @itemExistsInCurrentPriceList = 1;
             select ItemExistsInCurrentPriceList = @itemExistsInCurrentPriceList
                      ,Currency = isnull(cp.TwC_Waluta,(select isnull(Price.TwC_Waluta,'') from CustomerPanel.GetCurrentPrice(@articleId,tk.Twr_CenaSpr,@dataTS) Price))
                      ,Denominator = isnull(tj.TwJ_PrzeliczM,1)
                      ,Numerator = isnull(tj.TwJ_PrzeliczL,1)
                      ,IsUnitTotal = isnull(tj.TwJ_Calkowita,isnull(tk.Twr_JmCalkowita,0))
                      ,[Type] = isnull(tk.Twr_Typ,1)
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
                                                                                                                                         datediff(day,convert(datetime,'18001228',105),getdate()),
                                                                                                                                         0,
                                                                                                                                         1,
                                                                                                                                         @companyUnitId,
                                                                                                                                         @companyUnitId,
                                                                                                                                         0,
                                                                                                                                         0,0,0,0,default),'-','0:'),'0:'),':',1),',','.')
                                    else CustomerPanel.GetItemsStockLevel(Twr_Typ,Twr_GIDNumer,@warehouseId,@features,@isFeaturesFiltered,isnull(tk.Twr_CCKNumer,0),@companyUnitId,@customerId,@stockFromWarehouse)
                                  end as decimal(15,4))
                           ,BasePriceNo = @basePriceNo
                           ,PurchasePrice = isnull(PPrice.Twc_Wartosc,0)
                           ,DefaultUnitNo = isnull(tk.Twr_JMPulpitKnt,0)
                           ,BasicUnit = isnull(ut.TLM_Tekst,tk.Twr_Jm)
                           ,AuxiliaryUnit = isnull(at.TLM_Tekst,tj.TwJ_JmZ)
                           ,UnitLockChange = isnull(tk.Twr_JMBlokujZmiane,0)
                    from CDN.TwrKarty tk
                    left join CDN.TwrJm tj on tk.Twr_GIDNumer=tj.TwJ_TwrNumer and tj.TwJ_PulpitKnt=1 and tj.TwJ_TwrLp=tk.Twr_JMPulpitKnt and tj.TwJ_TypJm<>3
                    join CDN.Nazwy n on n.Naz_GIDTyp=144 and n.Naz_Nazwa=tk.Twr_Jm     
                    join @currentPrice as cp on tk.Twr_GIDNumer = cp.TwC_TwrNumer
                    left join CDN.Nazwy n1 on n1.Naz_GIDTyp=144 and n1.Naz_Nazwa=tj.TwJ_JmZ
                    join CDN.Nazwy as n2 on n2.Naz_GIDTyp = 64 and n2.Naz_GIDLp = cp.TwC_TwrLp
                    left join CDN.Tlumaczenia ut on ut.TLM_Typ=144 and ut.TLM_Numer=n.Naz_GIDLp and ut.TLM_Jezyk=@erpLanguageId and ut.TLM_Pole=2  
                    left join CDN.Tlumaczenia at on at.TLM_Typ=144 and at.TLM_Numer=n1.Naz_GIDLp and at.TLM_Jezyk=@erpLanguageId and at.TLM_Pole=2
                    left join CDN.TwrCeny PPrice on PPrice.TwC_TwrTyp=tk.Twr_GIDTyp and PPrice.TwC_TwrNumer=tk.Twr_GIDNumer and PPrice.TwC_TwrLp=0

             where  tk.Twr_GIDNumer = @articleId
         end
END