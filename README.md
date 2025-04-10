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

<!-- > 注：只是改了我之前提到的那几个。并没有通篇精修。我记得我最开始上传前已经修改了几个明显很奇怪的翻译（比如“有时我会享受伤害他人的行为”被他翻成了“我有S倾向”，啊这），不过好像有一些比较隐晦的问题我当时没看出来。虽然因为填鸭式教学以及英语老师的普遍恶心人（指：我及我周围的一些同学，不是所有老师，也不是所有同学）（后来我还分析过这个问题：********本来写了一段，不过这种事实可能会无意伤人，故删去。真相往往是反直觉的，因此少有人看清真相。看清所有真相且不迷惘的，不是人，是圣人。）我恨透了洋文，高考刷题到140后来就实在不愿学了，目前词汇量为0，不过对全球的艺术与文化我是一视同仁的，这么多年下来只要查过字典，对语言情感的把握应当还是到位的。虽然矫枉过正也非好事。
>另注：改翻译的理由：
>  -->
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

<!-- 突然想起一件事，之前我和我对象路过事故现场，我们两人都只是看了地上嚎哭的两个人一眼，然后讨论了一下原因就头也不回地继续往前走了。

这好像不太正常吧。

最近越来越频繁地陷入无意识的状态了，醒来之后记不清发生了什么，虽然在无意识状态中依然可以完成吃饭与走路等基本行动。比较影响工作与生活。我的表分之前一直比较稳定，但是最近这段时间F与Sc在急速增高。

由于某种原因，Readme中的有些表述今年年底可能会删掉，并且之后由于另一种原因可能也不会重新复原。不过这是年底的事情。 -->

Nothing......

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

---
2024.2.21

过年没仔细跟，收到了一堆邮件，还以为是被轰炸了，刚刚扫了一眼好像是都是正常输入。进行了正常换端。

24年将会有大事发生，我不一定有空继续完善。有空的话会继续写。

鸽子，有鸽子~

---
2024.3.11

正常维护（换源 1->3）

---
2024.3.20

（去年写项目的时候在主页上设了一个debug按钮，在my_script里面设了对应的my_test函数。都可以ctrl-f到。）

记录：有个老哥发了个Issue说Mf找不到，给了个大致的交表时间，我刚刚看了一下。这是我实际上第一次认真审视收到的结果，突然意识到一些之前被忽略了的显而易见的事情：

1、首先，我根本不知道做表人的性别，我的调试系统默认做表人为男性（因为当时测试的时候我只能拿我自己当样本）。我下载了十几份数据，全是这么跑的，可能了无意义。而且我在收集的时候没有记录性别……这回真草包了，届时统计的时候男女都跑一遍吧……如果有“届时”的话。之后有空要立刻更新收集逻辑。

2、即使存在上述问题，似乎也不应当出现如此离谱的结果：十几份数据，居然没有一份有效的……而且无一例外全是F超标，都是一百分以上，高得离谱，有一半都跑到表外面去了。这个事实需要仔细分析一下，离谱得过了头。

3、第三方表单收集系统本身存在一些问题：（1）空表项，不知道是不是因为用户的网络问题。（2）全T项，怀疑是机器人打的。（3）重复项，极相近时间的两份表，似乎是完全一样的数据。怀疑是用户自己连续点击了两次。这会占用两个名额。

这件事还没完。先这样吧，最近赶很多东西，可能最近没空再弄这个。

---
2024.3.21

正常维护（换源 3->4）

---
2024.4.10

日常维护（换源 4->1）

---
2024.4.19

日常维护（换源 1->3）

---
2024.4.28

日常维护（换源 3->4）


---
2024.5.7

日常维护（换源 4->1）


---
2024.5.14

虽然手动事情很紧，但是因为有一个比较抽象的事情，耽搁了正事，想一想，要烂就烂到底，干脆来个版本大迭代。

工作如下：
1、性别收集，以及其他可能的收集优化
在性别的onclick上加一条，使传输的数据里包含该数据。

2、全空表 重复项 全T项处理？
发送前，对收集的数据进行检查，在onsubmmit里面加个js脚本就行。重复项检查不了，因为这网址本质上实际上是一个组合逻辑，无法记录之前的状态。全空和全T是有办法的，目前赶时间，没仔细想，做了一个很dummy的实现，但是能好好运行，那就这样吧……只是全空到底是怎么回事？按理来说全空不是发不出来吗？
（有一些比较抽象的问题，纯工程，这里就不提了。代码里注释了。）

另外，是否要允许接收空题？发现如果空题的话，结果队列ans里会记录为 ? ，而不是之前以为的void。这为解决问题提供了可能性，要改应该挺容易的，不过今天先算了吧，主要是之前为了“不允许空题”我加的那一堆屎山我自己都不想看……这个之后还是得修，当时设计的时候草率了。
<!-- 嗯……这个通过my_test好像测不了。my_test是已经获取表项值之后的逻辑了。 -->

3、翻译精化：314 343 371
> 314：有歧义。
> 
> 343：不确定。按MMPI1翻译。
> 
> 371：不通畅。

4、robots.txt好像是用来限制抓取的。我不需要。

5、新增知乎科普页面。

另外，笑死，看第三方SEO报告的时候发现，我的主页面它只统计出了114个词，而SEO认为“字数太短，内容质量存疑，建议增加”，实际上主要内容都是用js刷出来的，他统计不到……这个就不修了。主要是，当时我拿到的版本用的是按性别刷题目的思路……本来男女各建一个page，各走一套算法也挺简单的，不知道那哥们为啥要给自己加难度，为了简洁吗？其实也不太简洁，维护起来麻烦死了……


另：0、备份所有表项数据，并进行统计分析。

本来打算今天把这项也做完，没想到前面那一堆事搞这么久。那就之后再说了。

未尽：接收空题 以及 数据分析

以及：事已至此，要不要干脆把MMPI1也整上去？MMPI1是有公论的，2实在是没有中国常模。

（翻译还有问题……一堆“指派性别”还没改完）


---
2024.5.16

日常维护 1->3

以及最近好像没有大哥给我打钱买游戏，虽然最近压根也没买游戏:(
（除了GTFO那个极致坐牢玩意）

---
2024.5.23晚

之前有一位朋友指出了若干问题，最近很忙，我还没来得及修；发现微架构上的工作不太对头，跑完数字综合还不够，似乎要一路干到布线，有点离谱。

另有人指出翻译的一个错误，这个比较紧急，立刻弄了一下，详见 Issue#9

另：
（1）无意中发现的MMPI-2的民间（？）翻译，效度存疑。
https://blog.ooyeep.uk/MMPI-2-ming-ni-su-da-duo-xiang-ren-ge-ce-yan-567-ti-ying-wen-yuan-ti-he-zhong-wen-fan-yi

（2）《MMPI-2中文简体字版使用手册》这本书的资源怎么又出来了？我记得我最开始是有电子书资源的（无法下载），后来莫名其妙又找不到了，现在怎么又有了？插个眼，看看以后会不会又没有。强烈建议所有确实希望搞清楚MMPI系列的人阅读这本书。MMPI是有偏的数学。
https://book.sciencereading.cn/shop/book/Booksimple/show.do?id=BBD17DCED8D1311C4E053010B0A0ADAAD000


---
2024.5.28

日常维护（换源 3->4）
之前几天就已经满了，但是没精力来换源，虽然就是两行注释的事。

---
2024.6.11

日常维护 4->1

---
2024.6.25

日常维护 1->3

---
2024.7.4

虽说最近一直在干别的，没空把之前剩下的问题弄完，不过在收到邮件数基本不变的情况下，github star没变且要不到饭，估计是什么设计出了问题。
强烈怀疑我的那个“主页”并没有被google优先显示出来，之后可能需要再做一个回退至主页的操作。

---
2024.7.12

有人指出了翻译中的一些问题，详见Issue，已订正。

最近很麻，之前还欠了一堆问题以后搞。

另：177好像也有问题 下次再改

以及448 459 470 541

---
2024.7.16

日常维护 3->4

---
2024.7.26

日常维护 4->1

---
2024.8.11

日常维护 1->3

---
2024.8.12

准备干票大的。

---
2024.8.22

日常维护 3->4

大的没干成。声色犬马多年，哪怕不像那闯将，也与太平天国的天王们无异了。

再来再来。

---
2024.8.23

做了一次版本迭代。

1、优化undefined

之前那位朋友说，undefined可能会让人迷惑。之前其实已经优化过了，这次是把表中的undefined替换为了一些提示。

2、引入修正分

部分解决了之前提过中美常模差异的问题。在根目录下加了一个txt文件夹给完全不清楚原理的路人解释了一下为什么要“修正”，并且在结果展示中同时展示了修正后的表。

3、原始选项展示

之前有人发issue问我一些问题，但是由于我并没有留存用户信息，所以我找不到他的结果是哪份文件。现在在结果展示中展示了原始选择的字符串，用户可以自行选择是否保存以待后用。

没做完的事情：

1、翻译

那位朋友提了几个翻译问题我还没弄。之前自己也欠了一些翻译问题没修。

2、submit的附加value

这里面似乎也可以放结果字符串。但是有意义吗？反正统计的时候肯定得去下载邮件，躲不掉，似乎。

3、分析框架

手上数据估计有大几百份了。我最开始绝没想过能收到这么多表。既然如此，可以想办法设计一套框架来收集并分析大家的数据了，不知道最后会不会有什么有趣的结果。


先这样吧。不知道会拖到什么时候。

:P

---
2024.8.27

修改了之前的几个拼写错误，并修改了一个T分打表错误（猜测性地）。

修改了一个LW5亚量表的打表错误（猜测性地）。

精校了翻译：

177 448 541

538 338 305 78 384 566 215（？） 306（？） 487（？） 46 90（？） 101 158 171 391 406 448 512 541

48

....

晚上进行了数据处理。简单来讲，找到了一个办法把gmail里面那两千封邮件搞下来，然后搞了6个脚本对数据进行一步步处理（幸好现在有gpt，要不然这6个python脚本都可以写死我）。

元数据->时间与正文->格式化的正文->编号->去掉全T全F全空->去重复项

经过这一套处理后，目前手中共有1291（1795->1617->1291）份格式有效的问卷。之后会设法构建一套框架对他们进行统一算分，再将其中数据有效的问卷提取出来，之后进行进一步的统计分析。


---
2024.8.28

记录一个非常难绷的点

原程序里，是用一个叫ans的数组记录所有原始选项的，这是一个全局数组，最开始设为\[\]，后来设为\[undefined\]，之后再往里面push东西。

……然后他真正计分的时候，是从ans\[1\]开始算的，ans\[0\]就是undefined……去年看到了这一点，今天在搞数据，如果不是眼尖发现少了一项，最后处理出来的数据都将会是错的（全部前移一项），而且根本无法发现……

太离谱了。

---
2024.9.11

日常维护 4->1

之前干了票大的，不过数据没贴出来。因为暂时还是一头雾水。目前先这样。

---
2024.9.23

又是一年秋分过去了。

日常维护 1->3

---
2024.10.11

寒露已过

日常维护 3->4

---
2024.10.15

发现两个小问题。画图那里，是校正不是矫正，之前一直没发现。

Si的结语里面好像有错别字。

---
2024.10.21

日常维护 4->1


---
2024.11.13

日常维护 1->3

修改了444题的翻译

推测地修改了Sc4的打表问题（因为找不到原数据，随便挑了个不太离谱的）

将矫正修改为校正

Si的结语里的错别字我看了几遍又没找到，不知道是没看见还是上回看错了

---
2024.11.22

日常维护 3->4

---
2024.12.9

日常维护 4->1

---
2024.12.9 <- 12.20 笑死，看来日子确实过糊涂了

日常维护 1->3

---
2025.1.16

日常维护 3->4

---
2025.2.17

日常维护 4->1

---
2025.3.14

日常维护 1->3

---
2025.4.10

日常维护 3->4
