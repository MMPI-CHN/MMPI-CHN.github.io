# MMPI-CHN.github.io

累了……懒得搞格式了，先随便打点吧，以后想起来再好好整理一下
（2023.11.16感谢有个哥哥把格式改了改，让流水账高了一个档次）

1. 我不是搞前端的……我平常是搞 kernel 和编译，然后弄弄异构板子的…… JS HTML CSS 全都不熟，基本上是做这个憨批项目的时候现场自学的……这项目就我一个人，也没哪个合作……可能大哥半小时能搞完的东西我要搞一天  

2. 其实这是我第一次严格意义上使用 GitHub（抄作业不算）……很多规矩还不清楚……这个项目的部分源码是用了另一个哥哥的，俺也不知道咋引用，把[网址](https://github.com/AstralLing/MMPI2)贴这里吧。 然后就是这个哥哥的代码很好用，也很漂亮，感兴趣的可以看看[这个](https://github.com/SHENGYUKing/MMPI_Test)  

3. 这可能是国内第一个真正上线了的全免费 MMPI-2 中文测试（附结果、剖析图、解析），2023年2月上线；因为是用 GitHub Pages，纯前端，不知道什么时候会被人盗掉拿去卖钱，乐  

4. 解析别当真啊，别当真，MMPI很专业，不是说看几个值就敢给结果的；那个图应该是没问题的，我尽力测试过了（前提是我用的那个哥的代码算一致性 T 分没算错，好像那个哥用的也是别人的代码）；解析别当真……剖析图可以拿给专业人士分析一下  

5. 移动端有些问题懒得调了；大哥十分钟能搞定，我磨了一晚上洋工没搞明白，拉倒  

6. SEO 没做好，搜索引擎很可能搜不到；也许过两年 Google 可以搜到，但百度，百度估计是不行的……  

先这样吧，江湖有缘再见  

---
2023.3.13  

Google 牛的，按要求做了点 SEO 之后就能在 Google 里面搜索到这个页面了，不过看控制台好像最近几天并没有人搜到这个页面（所有的访问的都是我自己点的……），悲

---
2023.3.19  

看开发者控制台，好像有除了我之外的人搜 MMPI 中文测试的时候我的这个页面被 Google 展示过了，好像偶尔也有人点过了，不知道能不能帮到路人:D

---
2023.4.3半夜两点    

半夜PUBG人机还是能打的，没挂……    

说回项目：我在控制台里面看到google的搜索量慢慢地多起来了（虽然曝光数和点击数稳定地保持在个位数），也许要安排一下这个项目的后续？  

目前想到的可以做的事：  

1. 移动端，bug修一下  

2. 有个用户不友好的点：最后出结果的两个按钮，如果用户没有仔细看导读的话，很可能点错；可以修改一下点击时的脚本，或者干脆多加几个字  

3. 双语？反正有哥哥已经翻译好了题目了……不对，应该说本来就是英文的，中文是某个哥哥翻翻的（应当与心理所给的官方版本有出入），所以如果要做双语，应当是把导语、结果之类的重新处理一下。另一个关键问题在于**常模**……再议，再议  

有没有懂前端的哥哥把前两点弄一下啊，我自己弄也可以，但是懒得搞了

差不多先这样安排，看看能鸽几年

从控制台来看，全球各地的 IP 都搜到过这个页面；但由于这个页面的 title 不太可能被非中文用户搜到，所以推测应该是大陆地区的人开了梯子；似乎偶尔也有繁体字用户搜到过这个页面。

目前是收到了 20 份左右的问卷结果，由于没有后端，并不知道实际上有多少人做过。个人估计得知这个链接的绝大多数人应该是靠社交软件传播的，通过 Google 搜到该页面的人应当是少的。

……先这样，先睡了，调作息  

早睡早起身体棒，真的  

---

2023.5.26 半夜两点

想起来之前欠了个收款码没放上去，当时不好意思，觉得自己弄的东西可能挺拉的，放了估计也是自欺欺人。不过这段时间发现用的人还蛮多的（网页上有两个按钮，点第一个会发匿名结果到我邮箱，基本每天都能收到几份，而且肯定不是所有人都发了），所以便放了个收款码上去，欢喜随缘。做了问卷的，我不一定帮到了；但愿意散财布施的，我一定帮到了。

希望我的工作有价值。

> 附：说好的早睡早起结果作息越来越不阳间了……

---
2023.5.26 晚上十点半

发现原来那个科普网页失效了，重新撸了一个。

并且设法对最后算结果的按钮那里加了详细的注释，我是真的怕有暴躁老哥点错按钮骂街。

另外，把移动端的一个空函数改成了原函数的简略版本，算是部分地解决了移动端适配的问题。

---
2023.7.26

前几天 Formspree （我采用的一个有限额的收集表单的解决方案；因为 GitHub Page不配后端，所以只能这么解决）给我发邮件说我已经达到每月限额了（50份）。

考虑到并不是每一个做测试的人都会自愿将结果发送，所以预估可能已经有不少人使用过该测试了；之前心理所的朋友好像是和我说过超过一百份有效表格就算是“较多”。

该事实辅证了此测验所具有的前景；基于该事实，将来我若有空，可能需要重新认真审视所有源代码，找出需要进行优化的点。刚刚撸完一个浮点运算器，现在在撸别的，没空撸这个。要是有专业的前端大哥有空做这个事情，那效率会更高。

---
2023.8.30

这两个月都达到了 Formspree 的表单的免费收集额度（每月五十份）且均有几份表单未成功收集。推测每月进行测试的人数超过一百。

考虑下个月用另一个邮箱注册另一个表单收集账户，用来收集月末的数据。不知道该公司是否对这种做法进行了限制。

另一方面，现在我手上已经有好些匿名数据了，是否需要对这些匿名数据进行统计学分析？

暂记下，可做进一步考虑。

---
2023.9.5

> q166 184 233 242 399 405 459 472 486 498 502 510 511 517 526 530 540的翻译是不是有问题？

刚刚自己仔细看了一下，好像有些翻译不太对。此翻译的作者似乎不是机翻，但是意译不太到位，不少表述的英文情感（正负面等）没翻出来。

后期我可能得再精修一下，要不然有几题可能会选错，影响最终结果。

或者有大哥如果能搞到心理所授权的 MMPI2 的中文翻译可以拿出来 copy 一下。（这是可以说的吗？应该不刑吧）

---
9.5 半夜

晚上发现代码似乎有些问题……刚刚仔细看了看，虚惊一场。详细情况以后有空再说。差点被吓尿了。

---
2023.11.15-16

先提一下9.5那个事。我那天突然发现这个表的数据和MMPI1有些对不上，还以为代码有bug，不过做了几组有代表性的数据测试以后断言代码本身是没问题的，至少和网上流传的MMPI1在正确性上是等价的。他们的主要区别在于计算公式中的某些参数以及题目本身发生了改变。由于MMPI2内部的实际上是黑盒，关键参数是保密的（虽然还是被泄露出来了），所以我一开始就说过了，我这个项目正确的前提是“我用的那个哥的代码算一致性 T 分没算错”。不过我自己也做过几遍，没感觉到啥问题，就算有问题也是常模上的问题：他也许用的是美国常模，那样也是分数整体偏高，不至于出现反复横跳，剖析曲线的趋势应当不会受到影响。

最近在做架构方面的工作，很搞心态，而且我这段时间非常背，破事更搞。这段时间本不打算更新的，但是15号的时候那个第三方平台就给我发邮件说每月的免费收集额度已经到了0.9了（原来都是每月的最后几天才会触发low_watermark），虽然我暂时不知道收集这些路人自愿发过来的匿名结果有啥用，但是既然有人愿意发，我应当也有义务收好。于是我去实现了之前已经想到的一个trick，即：

赌一把，第三方平台不做后端检测。

赌赢了，我确实在一个账户里面仅仅新建了一个project就可以拿到对同一个url的另外五十份的额外月免费额度，由此可见他并没有对url做检测，算是他系统上的一个漏洞。至少我暂时没被红信，说不定他为了省资源做异步检测呢，说不准。

另一方面，干脆把之前某个老哥提的issue完善了一下。他当时碰到的问题的是F的K值修正为undefined，换句话说是就是剖析图里少了一个点两根线。我当时琢磨了一下他的raw score，发现是因为他的F分太高，导致了undefined（因为MMPI的原理是根据原始分查表得T分（简单来说是这样））。代码里最后的T分都是用tscore表示的，并且塞到tscoreArray中进行暂存，并根据该矩阵进行打表与画图。我定位了某几个关键值的下标，并用alert的方式抛异常。目前如果效度量表与临床量表中出现了undefined的值，都会弹个框出来告知用户（当然，如果被浏览器阻止了，那就没办法），并且给出了那个issue的url以供查看。alert里面好像不能加超链接，所以就打了一行，很土，但是好用。

其实我本来是想加个div element，像开屏提示那样打个表出来，不仅可以规避被浏览器拦截的风险，而且可以加超链接，增加引用量，提升在搜索引擎中的权重。不过一旦这么干了，就需要进行一系列的维护（主要是长宽问题与移动端适配），其实也就是半个小时的事，不过懒得搞了。

既然搞到这里了，就干脆把翻译也给修了一下。至此，比较显而易见的问题和这段时间发现的可以优化的点基本上都填完了。剩下的都是饼，小麦已经买好了，未来再烙。

> 注：只是改了我之前提到的那几个。并没有通篇精修。我记得我最开始上传前已经修改了几个明显很奇怪的翻译（比如“有时我会享受伤害他人的行为”被他翻成了“我有S倾向”，啊这），不过好像有一些比较隐晦的问题我当时没看出来。虽然因为填鸭式教学以及英语老师的普遍恶心人（指：我及我周围的一些同学，不是所有老师，也不是所有同学）（后来我还分析过这个问题：********本来写了一段，不过这种事实可能会无意伤人，故删去。真相往往是反直觉的，因此少有人看清真相。看清所有真相且不迷惘的，不是人，是圣人。）我恨透了洋文，高考刷题到140后来就实在不愿学了，目前词汇量为0，不过对全球的艺术与文化我是一视同仁的，这么多年下来只要查过字典，对语言情感的把握应当还是到位的。虽然矫枉过正也非好事。
>另注：改翻译的理由：
> 
> 166：原作者直译。不是谁都理解什么叫做“指派性别”。
> 
> 184：原作者对daydream理解有误。MMPI1将其翻作“白日梦”，且根据量表计分规则，与184有关的主要量表是Psychoticism与Superlative Self-Presentation。翻作“白日梦”更合适。
> 
> 233：纯粹只是翻错了。
> 
> 242：作者意译。改直译。MMPI1也是直译。
>
> 399：好像没问题？
> 
> 405:upset应当翻作“失望”。
> 
> 459：好像没问题？
> 
> 472：意译不准，改直译。
> 
> 486：情感错误。
> 
> 498：漏了信息。
> 
> 502：harmful，不一定是说对他人有害。MMPI1也无此项信息。
> 
> 510：意译改直译。
> 
> 511：原作者未理解洋文里的 high
> 
> 517：hold down？我也不太清楚这个词的感情是主动还是被动
> 
> 526：好像没问题？
> 
> 530：漏了信息。
> 
> 540：漏了信息。
> 


---
2023.11.16 下午

上午傻了一下，他不是没查，他只是没告知我。同一个账号的限额是一定的。用qq邮箱办了个新号，然后重定向到gmail，看起来可行。

以及突然发现之前修好的移动端字不全的bug又出现了，虚空debug后发现是媒体查询那里的条件出了问题。最近换了个手机，所以显示不出来。因为我手上设备有限，所以不知道大家的显示有没有问题；不过PC端应该都是OK的。

完工。

。。。。。随便扫了一眼发现他85和323题也翻错了，改了一下。
沃日，不对啊，323题好像是我半年前自己改翻的 笑死，当时漏了个词

---
11.16晚

发现下午有几份表还是投到了限额爆了的那个账户里，不过刚刚找了另一个人的机子测了一下，我的代码确实应当把表投到新账户中。想了一下，怀疑是我这边deploy之后，各服务器的缓存没有跟上，明天应该就好了。明天再看一眼。

---
11.22

迄今为止一切正常。

---
12.1

发现314题翻译有歧义。还没改，下次再说。

还有343 371 459

---
12.11

发现12.9受到了攻击，gmail中收到了大量的无用量表（全T）。不知道是有老哥闲的没事反复提交的，还是网上流窜的无主脚本自己干的，还是收费站主雇人弄的。

对线上服务没影响，不过结果收集被爆破了。之后什么时候有空我再回来添加反制措施。没有后端，感觉不是很好弄。可能可以通过限制ip等简单方式加以反制。

---
12.12

上收集表项的后台看了一样，攻击应该持续到了10号。攻击形式如下：

![image](https://github.com/MMPI-CHN/MMPI-CHN.github.io/assets/124654931/24976729-a4e4-4ce2-ae1f-35bcb25a55d4)

而正常的提交结果类似于这样：

![image](https://github.com/MMPI-CHN/MMPI-CHN.github.io/assets/124654931/d91338ac-9798-4f42-b214-66675b9976b9)

具体是怎么回事还没去想。不过我还是比较奇怪，为什么message里面的内容看起来像是福音，这算啥？精神攻击？

最近工作上的内容到一个关键节点了，不过有一些事情搞得我很没精神……以后有空再来修这些。目前来看是有12份结果被挡了。比较好奇所有这些数据最后会反映出什么结果，不过懒得download下来跑统计，又得上工。

---
12.19

之前欠的一些问题暂时没有力气修，攻击的问题也没去解决。只是将收集链接更换为了原链接（新链接之前已经爆了，而这个月还要十几天）。

只是注释掉了一行并将原代码解除注释……应该不至于出bug吧，我没做测试。

---
12.27 子夜

扫了一眼，好像最近没受到攻击，但是表还是爆掉了。

感觉项目流传得好像越来越广？希望原项目的算法自己没有bug，数据是死的，泄出来的也就那一个，我自己无法证伪。

---
2024.1.3

突然想起一件事，之前我和我对象路过事故现场，我们两人都只是看了地上嚎哭的两个人一眼，然后讨论了一下原因就头也不回地继续往前走了。

这好像不太正常吧。

最近越来越频繁地陷入无意识的状态了，醒来之后记不清发生了什么，虽然在无意识状态中依然可以完成吃饭与走路等基本行动。比较影响工作与生活。我的表分之前一直比较稳定，但是最近这段时间F与Sc在急速增高。

由于某种原因，Readme中的有些表述今年年底可能会删掉，并且之后由于另一种原因可能也不会重新复原。不过这是年底的事情。

---
2024.1.7

刚看了一眼，好像匿名收集端爆了，应该没有受到攻击，就是正常爆了。这个速度有点快，可能过段时间不得不考虑项目后续安排了，虽然最近人很麻。

刚刚换了个源，希望别出bug。

---
2024.1.16

月半，报了“full”的warning。不过看起来好像没满？不知道是不是那边服务器缓存的问题。真满了的话，就再继续加账户吧。不是办法的办法。

另外，我又去尝试了一下在百度上面上线索引，不过这次不报去年那个错了，报了个这个：

![image](https://github.com/MMPI-CHN/MMPI-CHN.github.io/assets/124654931/d9001e6c-a806-452d-a617-1af9782963f7)

baidu和google都搜不到这个报错。想了一下，他说主域站点过多，应该是指已经有很多人已经提交过github的page了，这好像不是我能解决的问题，除非在第三方租域名。

要是有朋友知道怎么解决可以说一声。

---
2024.1.19

现在确实是基本上满了，刚刚用最后一个常用邮箱新建了一个账户，又开了个端。目前一共有1 2 3 4共4个端，其中由于2是无效端，故有效端数为3，每个端的月限额为50，且由于没充钱，他自己提供的统计功能并无法使用，不过所有匿名数据的原始文本全部在gmail中有备份，届时可能需要手动统计整理。目前手上的数据很多了，比较好奇最后会统出什么结果。

4号端应该是没问题的，晚些看两眼。
