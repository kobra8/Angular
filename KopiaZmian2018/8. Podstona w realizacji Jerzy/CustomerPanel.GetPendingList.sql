
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 
ALTER PROCEDURE [CustomerPanel].[GetPendingList]
	@artIds CustomerPanel.ResultIdsType readonly
   ,@docIds CustomerPanel.ResultIdsType readonly
   ,@languageId tinyint
   ,@customerId int      
   ,@dateFrom datetime
   ,@dateTo datetime
   ,@skip int
   ,@take int
AS
BEGIN
	set nocount on;

	declare @dictionaryLangId int;
	select @dictionaryLangId=SLW_ID
	from CDN.Slowniki
	where SLW_Predefiniowany=(case @languageId when 2 then 21 when 3 then 34 when 4 then 22 when 5 then 24
											   when 6 then 35 when 7 then 23 when 8 then 36 when 9 then 100
											   when 10 then 98 when 11 then 99 when 12 then 101 else 20 end);

    if not exists(select top 1 Id from @artIds) and not exists(select top 1 Id from @docIds)
	begin
		select Id
			  ,Faid
			  ,[Type]
			  ,Number
			  ,SourceNumber
			  ,[State]
			  ,Wmnumer
			  ,Fsnumer
			  ,Code
			  ,ItemId
			  ,Name
			  ,OrderedQuantity
			  ,CompletedQuantity
			  ,QuantityToComplete
			  ,Wmilosc
			  ,DefaultUnitNo
			  ,BasicUnit
			  ,AuxiliaryUnit
			  ,Denominator
			  ,Numerator
			  ,IssueDate
			  ,ExpectedDate
			  ,Wmdata
			  ,IsAvailable

from (
			 select RowNumber = row_number() over (order by ZaN_DataWystawienia desc, ZaN_ZamSeria, ZaN_ZamRok, ZaN_ZamNumer desc)
				   ,Id = ZaN_GIDNumer
				   ,Faid = TrN_GIDNumer
				   ,[Type] = isnull(TrN_GIDTyp,0)
				   ,Number = CDN.NumerDokumentu(CDN.DokMapTypDokumentu(ZaN_GIDTyp,ZaN_ZamTyp,ZaN_Rodzaj),0,0,ZaN_ZamNumer,ZaN_ZamRok,ZaN_ZamSeria,ZaN_ZamMiesiac)
				   ,SourceNumber = isnull(ZaN_DokumentObcy,'')
				   ,[State] = CustomerPanel.GetState(@languageId,ZaN_Stan,960)
				   ,Wmnumer = isnull( CDN.NumerDokumentuTRN(MaN_GIDTyp, 0, MaN_TrNTyp, MaN_TrNNumer, MaN_TrNRok, MaN_TrNSeria),'')
				   ,Fsnumer = CDN.NumerDokumentutrn(Trn_gidtyp, trn_spityp, trn_trntyp, trn_trnnumer, TrN_TrNRok,TrN_TrNSeria)
				   ,Code = isnull(Twr_Kod,'')
				   ,ItemId = Twr_GIDNumer
				   ,Name = isnull(n.TLM_Tekst,Twr_Nazwa)
				   ,OrderedQuantity = cast(ZaE_ilosc*ZaE_PrzeliczM/ZaE_PrzeliczL as decimal(15,4))
				   ,CompletedQuantity = cast((ZaE_Ilosc - isnull((select sum(Rez_Ilosc) - sum(Rez_Zrealizowano) from CDN.Rezerwacje where Rez_ZrdTyp=ZaE_GIDTyp and Rez_ZrdNumer=ZaE_GIDNumer and Rez_ZrdLp=ZaE_GIDLp and Rez_KntNumer=@customerId),0))*ZaE_PrzeliczM/ZaE_PrzeliczL as decimal(15,4))
				   ,QuantityToComplete = cast(ZaE_ilosc*ZaE_PrzeliczM/ZaE_PrzeliczL as decimal(15,4)) - cast((ZaE_Ilosc - isnull((select sum(Rez_Ilosc) - sum(Rez_Zrealizowano) from CDN.Rezerwacje where Rez_ZrdTyp=ZaE_GIDTyp and Rez_ZrdNumer=ZaE_GIDNumer and Rez_ZrdLp=ZaE_GIDLp and Rez_KntNumer=@customerId),0))*ZaE_PrzeliczM/ZaE_PrzeliczL as decimal(15,4))
				   ,Wmilosc= isnull( cast(MaS_Ilosc*MaE_PrzeliczM/MaE_PrzeliczL as decimal(15,4)),0)  
				   ,DefaultUnitNo = case when isnull(ZaE_JmZ,Twr_Jm)=Twr_Jm then 0 else isnull(u1.TwJ_TwrLp, isnull(u.TwJ_TwrLp,0)) end
				   ,BasicUnit = isnull(ut.TLM_Tekst,Twr_Jm)
				   ,AuxiliaryUnit = isnull(at.TLM_Tekst,ZaE_JmZ)
				   ,Denominator = isnull(ZaE_PrzeliczM,1)
				   ,Numerator = isnull(ZaE_PrzeliczL,1)
				   ,IssueDate = convert(char(10), dateadd(d,ZaN_DataWystawienia,'18001228'), 126)
				   ,ExpectedDate = convert(char(10), dateadd(d,Rez_DataRealizacji,'18001228'), 126)
				   ,Wmdata = convert(char(10), dateadd(d,MaN_Data3,'18001228'), 126)
				   ,IsAvailable = isnull(Twr_WCenniku,0)
				   
				   from cdn.ZamNag
					join cdn.MagNag on ZaN_GIDTyp=MaN_ZaNTyp and ZaN_GIDNumer=MaN_ZaNNumer
					join cdn.MagElem on MaN_GIDNumer=MaE_GIDNumer and MaN_GIDTyp=MaE_GIDTyp
					join cdn.MagSElem on MaE_GIDNumer=MaS_GIDNumer and MaE_GIDTyp= MaS_GIDTyp and MaE_GIDLp=MaS_GIDLp
					join CDN.TwrKarty on MaE_TwrNumer=Twr_GIDNumer
					left join cdn.ZamElem on ZaE_GIDNumer=MaS_ZlcNumer and ZaE_GIDTyp=MaS_ZlcTyp and ZaE_GIDLp=MaS_ZlcLp
					left join CDN.Tlumaczenia n on Twr_GIDTyp=n.TLM_Typ and Twr_GIDNumer=n.TLM_Numer and n.TLM_Jezyk=@dictionaryLangId and n.TLM_Pole=2
					join CDN.Nazwy on Naz_GIDTyp=144 and Naz_Nazwa=Twr_Jm	
					left join CDN.Tlumaczenia ut on ut.TLM_Typ=144 and ut.TLM_Numer=Naz_GIDLp and ut.TLM_Jezyk=@dictionaryLangId and ut.TLM_Pole=2
					left join CDN.Nazwy n1 on n1.Naz_GIDTyp=144 and n1.Naz_Nazwa=ZaE_JmZ
					left join CDN.Tlumaczenia at on at.TLM_Typ=144 and n1.Naz_GIDLp=at.TLM_Numer and at.TLM_Jezyk=@dictionaryLangId and at.TLM_Pole=2
					left join CDN.TwrJm u1 on Twr_GIDNumer=u1.TwJ_TwrNumer and ZaE_JmZ=u1.TwJ_JmZ and u1.TwJ_PulpitKnt=1
					left join CDN.TwrJm u on Twr_GIDNumer=u.TwJ_TwrNumer and Twr_JMPulpitKnt=u.TwJ_TwrLp and u.TwJ_PulpitKnt=1 and u.TwJ_TypJm<>3
					left join cdn.Rezerwacje on Rez_TwrNumer=ZaE_TwrNumer  and Rez_ZrdTyp=ZaE_GIDTyp and Rez_ZrdNumer= ZaE_GIDNumer
					left join cdn.TraNag on TrN_GIDNumer=MaS_ZrdNumer and  TrN_GIDTyp=MaS_ZrdTyp 

				where  ZaN_KntNumer=@customerId  and MaN_Data3 between datediff(d,'18001228',@dateFrom) and datediff(d,'18001228',@dateTo)
				) as o
				--order by Wmdata desc
					--where o.RowNumber between @skip and @skip+@take;
	end
	else
	begin
		select Id
			  ,Faid
			  ,[Type]
			  ,Number
			  ,SourceNumber
			  ,[State]
			  ,Wmnumer
			  ,Fsnumer
			  ,Code
			  ,ItemId
			  ,Name
			  ,OrderedQuantity
			  ,CompletedQuantity
			  ,QuantityToComplete
			  ,Wmilosc
			  ,DefaultUnitNo
			  ,BasicUnit
			  ,AuxiliaryUnit
			  ,Denominator
			  ,Numerator
			  ,IssueDate
			  ,ExpectedDate
			  ,Wmdata
			  ,IsAvailable
		from(
			 select RowNumber = row_number() over (order by ZaN_DataWystawienia desc, ZaN_ZamSeria, ZaN_ZamRok, ZaN_ZamNumer desc)
				   ,Id = ZaN_GIDNumer
				   ,FAId = TrN_GIDNumer
				   ,[Type] = isnull(TrN_GIDTyp,0)
				   ,Number = CDN.NumerDokumentu(CDN.DokMapTypDokumentu(ZaN_GIDTyp,ZaN_ZamTyp,ZaN_Rodzaj),0,0,ZaN_ZamNumer,ZaN_ZamRok,ZaN_ZamSeria,ZaN_ZamMiesiac)
				   ,SourceNumber = isnull(ZaN_DokumentObcy,'')
				   ,[State] = CustomerPanel.GetState(@languageId,ZaN_Stan,960)
				   ,WMNumer = isnull( CDN.NumerDokumentuTRN(MaN_GIDTyp, 0, MaN_TrNTyp, MaN_TrNNumer, MaN_TrNRok, MaN_TrNSeria),'')
				   ,FSNumer = CDN.NumerDokumentutrn(Trn_gidtyp, trn_spityp, trn_trntyp, trn_trnnumer, TrN_TrNRok,TrN_TrNSeria)
				   ,Code = isnull(Twr_Kod,'')
				   ,ItemId = Twr_GIDNumer
				   ,Name = isnull(n.TLM_Tekst,Twr_Nazwa)
				   ,OrderedQuantity = cast(ZaE_ilosc*ZaE_PrzeliczM/ZaE_PrzeliczL as decimal(15,4))
				   ,CompletedQuantity = cast((ZaE_Ilosc - isnull((select sum(Rez_Ilosc) - sum(Rez_Zrealizowano) from CDN.Rezerwacje where Rez_ZrdTyp=ZaE_GIDTyp and Rez_ZrdNumer=ZaE_GIDNumer and Rez_ZrdLp=ZaE_GIDLp and Rez_KntNumer=@customerId),0))*ZaE_PrzeliczM/ZaE_PrzeliczL as decimal(15,4))
				   ,QuantityToComplete = cast(ZaE_ilosc*ZaE_PrzeliczM/ZaE_PrzeliczL as decimal(15,4)) - cast((ZaE_Ilosc - isnull((select sum(Rez_Ilosc) - sum(Rez_Zrealizowano) from CDN.Rezerwacje where Rez_ZrdTyp=ZaE_GIDTyp and Rez_ZrdNumer=ZaE_GIDNumer and Rez_ZrdLp=ZaE_GIDLp and Rez_KntNumer=@customerId),0))*ZaE_PrzeliczM/ZaE_PrzeliczL as decimal(15,4))
				   ,Wmilosc= isnull( cast(MaS_Ilosc*MaE_PrzeliczM/MaE_PrzeliczL as decimal(15,4)),0)  
				   ,DefaultUnitNo = case when isnull(ZaE_JmZ,Twr_Jm)=Twr_Jm then 0 else isnull(u1.TwJ_TwrLp, isnull(u.TwJ_TwrLp,0)) end
				   ,BasicUnit = isnull(ut.TLM_Tekst,Twr_Jm)
				   ,AuxiliaryUnit = isnull(at.TLM_Tekst,ZaE_JmZ)
				   ,Denominator = isnull(ZaE_PrzeliczM,1)
				   ,Numerator = isnull(ZaE_PrzeliczL,1)
				   ,IssueDate = convert(char(10), dateadd(d,ZaN_DataWystawienia,'18001228'), 126)
				   ,ExpectedDate = convert(char(10), dateadd(d,Rez_DataRealizacji,'18001228'), 126)
				   ,WMData = convert(char(10), dateadd(d,MaN_Data3,'18001228'), 126)
				   ,IsAvailable = isnull(Twr_WCenniku,0)
				   
				   from cdn.ZamNag
				    left join @docIds did on ZaN_GIDNumer=did.ResultId	
					join cdn.MagNag on ZaN_GIDTyp=MaN_ZaNTyp and ZaN_GIDNumer=MaN_ZaNNumer
					join cdn.MagElem on MaN_GIDNumer=MaE_GIDNumer and MaN_GIDTyp=MaE_GIDTyp
					join cdn.MagSElem on MaE_GIDNumer=MaS_GIDNumer and MaE_GIDTyp= MaS_GIDTyp and MaE_GIDLp=MaS_GIDLp
					join CDN.TwrKarty on MaE_TwrNumer=Twr_GIDNumer
					left join @artIds aid on Twr_GIDNumer=aid.ResultId
					left join cdn.ZamElem on ZaE_GIDNumer=MaS_ZlcNumer and ZaE_GIDTyp=MaS_ZlcTyp and ZaE_GIDLp=MaS_ZlcLp
					left join CDN.Tlumaczenia n on Twr_GIDTyp=n.TLM_Typ and Twr_GIDNumer=n.TLM_Numer and n.TLM_Jezyk=@dictionaryLangId and n.TLM_Pole=2
					join CDN.Nazwy on Naz_GIDTyp=144 and Naz_Nazwa=Twr_Jm	
					left join CDN.Tlumaczenia ut on ut.TLM_Typ=144 and ut.TLM_Numer=Naz_GIDLp and ut.TLM_Jezyk=@dictionaryLangId and ut.TLM_Pole=2
					left join CDN.Nazwy n1 on n1.Naz_GIDTyp=144 and n1.Naz_Nazwa=ZaE_JmZ
					left join CDN.Tlumaczenia at on at.TLM_Typ=144 and n1.Naz_GIDLp=at.TLM_Numer and at.TLM_Jezyk=@dictionaryLangId and at.TLM_Pole=2
					left join CDN.TwrJm u1 on Twr_GIDNumer=u1.TwJ_TwrNumer and ZaE_JmZ=u1.TwJ_JmZ and u1.TwJ_PulpitKnt=1
					left join CDN.TwrJm u on Twr_GIDNumer=u.TwJ_TwrNumer and Twr_JMPulpitKnt=u.TwJ_TwrLp and u.TwJ_PulpitKnt=1 and u.TwJ_TypJm<>3
					left join cdn.Rezerwacje on Rez_TwrNumer=ZaE_TwrNumer  and Rez_ZrdTyp=ZaE_GIDTyp and Rez_ZrdNumer= ZaE_GIDNumer
					left join cdn.TraNag on TrN_GIDNumer=MaS_ZrdNumer and  TrN_GIDTyp=MaS_ZrdTyp 

				where   Zan_KntNumer=@customerId and MaN_Data3 between datediff(d,'18001228',@dateFrom) and datediff(d,'18001228',@dateTo)
				   and (did.Id is not null or aid.Id is not null)			 
		) as o
		--order by WMData desc
		--where o.RowNumber between @skip and @skip+@take;
	end

	select ShowCode=cast(rtrim(Kon_Wartosc) as bit) from CDN.Konfig where Kon_Numer=2312;
END

